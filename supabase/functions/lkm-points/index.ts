// lkm-points Edge Function
// GET /lkm-points → { balance, converted, milestones, nextMilestone, progress, ptsToNext }
//
// LKM may return /v2/Points as [{ points, balance, ... }] instead of a plain number.
// Prefer /v2/GetPoints (plain number); fall back to /v2/Points with parsing.

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import {
  lkmFetch,
  getClientToken,
  getSupabaseUser,
  getLkmCard,
  serviceDb,
  jsonResponse,
  errorResponse,
  LkmApiError,
} from '../_shared/lkm-client.ts';

const MILESTONES = [
  { pts: 500, label: 'Vale 5€' },
  { pts: 900, label: 'Vale 10€' },
  { pts: 1700, label: 'Vale 20€' },
];

function parsePoints(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  if (Array.isArray(raw) && raw.length > 0) return parsePoints(raw[0]);
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    for (const key of ['points', 'Points', 'ActualPoints', 'Pontos']) {
      const n = Number(o[key]);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

async function getClaimedPoints(userId: string): Promise<number> {
  const db = serviceDb();
  const { data } = await db
    .from('user_offer_claims')
    .select('points_cost')
    .eq('user_id', userId);
  return (data ?? []).reduce((sum, row) => sum + Number(row.points_cost ?? 0), 0);
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { user } = await getSupabaseUser(req);
    const { accessToken } = await getLkmCard(user.id);
    const clientToken = await getClientToken(accessToken);

    const [balanceRaw, convertedRaw, claimed] = await Promise.all([
      lkmFetch<unknown>('/v2/GetPoints', { clientToken }).catch(() =>
        lkmFetch<unknown>('/v2/Points', { clientToken }),
      ),
      lkmFetch<unknown>('/v2/GetConvertedPoints', { clientToken }),
      getClaimedPoints(user.id),
    ]);

    const lkmBalance = parsePoints(balanceRaw);
    const balance = Math.max(0, lkmBalance - claimed);
    const converted = parsePoints(convertedRaw);

    const nextMilestone = MILESTONES.find((m) => balance < m.pts) ?? null;
    const progress = nextMilestone
      ? Math.min((balance / nextMilestone.pts) * 100, 100)
      : 100;

    return jsonResponse(
      {
        balance,
        converted,
        milestones: MILESTONES,
        nextMilestone,
        progress,
        ptsToNext: nextMilestone ? nextMilestone.pts - balance : 0,
      },
      { headers: corsHeaders },
    );
  } catch (err) {
    if (err instanceof LkmApiError) {
      return errorResponse(err.message, err.status >= 500 ? 502 : err.status);
    }
    console.error('[lkm-points]', err);
    return errorResponse((err as Error).message, 500);
  }
});
