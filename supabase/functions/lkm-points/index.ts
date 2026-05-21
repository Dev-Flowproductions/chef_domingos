// lkm-points Edge Function
// GET /lkm-points → { balance, converted, milestones, nextMilestone, progress, ptsToNext }
//
// LKM API spec:
//   GET /v2/Points            → integer (int32)   — total points balance
//   GET /v2/GetConvertedPoints → number (double)   — converted monetary value

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import {
  lkmFetch,
  getClientToken,
  getSupabaseUser,
  getLkmCard,
  jsonResponse,
  errorResponse,
  LkmApiError,
} from '../_shared/lkm-client.ts';

const MILESTONES = [
  { pts: 300, label: 'Café Grátis' },
  { pts: 600, label: 'Sobremesa Grátis' },
  { pts: 900, label: 'Refeição Grátis' },
];

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { user } = await getSupabaseUser(req);
    const { accessToken } = await getLkmCard(user.id);
    const clientToken = await getClientToken(accessToken);

    // Both endpoints return a plain number (not wrapped in an object)
    const [balanceRaw, convertedRaw] = await Promise.all([
      lkmFetch<number>('/v2/Points',              { clientToken }),
      lkmFetch<number>('/v2/GetConvertedPoints',   { clientToken }),
    ]);

    const balance   = Number(balanceRaw ?? 0);
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
