// lkm-points Edge Function
// GET /lkm-points → { balance, converted, milestones, nextMilestone, progress, ptsToNext }
//
// LKM API spec:
//   GET /v2/Points            → integer (int32)   — total points balance
//   GET /v2/GetConvertedPoints → number (double)   — converted monetary value
//
// Programme rules (Chef Domingos):
//   Earn: 1€ = 100 points
//   Redeem fixed money vouchers: 500→5€, 900→10€, 1700→20€

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

    // Both endpoints return a plain number (not wrapped in an object)
    const [balanceRaw, convertedRaw, claimed] = await Promise.all([
      lkmFetch<number>('/v2/Points', { clientToken }),
      lkmFetch<number>('/v2/GetConvertedPoints', { clientToken }),
      getClaimedPoints(user.id),
    ]);

    // Available = LKM earned − points spent on app vouchers/promos
    const lkmBalance = Number(balanceRaw ?? 0);
    const balance = Math.max(0, lkmBalance - claimed);
    const converted = Number(convertedRaw ?? 0);

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
