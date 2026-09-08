// staff-points Edge Function
// Admin-only: look up a customer by Ganhar QR / card code, list recent earns,
// reverse points for a cancelled sale (by transaction or manual amount).
//
// GET  ?action=lookup&cardCode=...
// POST { action: 'reverse', cardCode, points?, lkmTxId?, reason? }

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import {
  getSupabaseUser,
  serviceDb,
  jsonResponse,
  errorResponse,
  getClientToken,
  lkmFetch,
  parseLkmPointsBalance,
  LkmApiError,
  getLkmConfig,
} from '../_shared/lkm-client.ts';

interface LkmTransaction {
  COD_TRANSACCAO?: number;
  COD_LOJA?: string;
  LOJA?: string;
  DATAHORA?: string;
  Valor_pago?: number;
  Valor_compra?: number;
  Pontos?: number;
  Pontos_resgatados?: number;
  IsCanceled?: boolean;
  [key: string]: unknown;
}

async function assertAdmin(userId: string, email: string | undefined): Promise<void> {
  const db = serviceDb();
  const { data } = await db.from('users').select('is_admin').eq('id', userId).maybeSingle();
  if (data?.is_admin) return;
  if (email?.trim().toLowerCase() === 'admin@chefdomingos.app') return;
  throw new Error('ADMIN_REQUIRED');
}

async function getReversedPoints(userId: string): Promise<number> {
  const db = serviceDb();
  const { data } = await db.from('points_reversals').select('points').eq('user_id', userId);
  return (data ?? []).reduce((sum, row) => sum + Number(row.points ?? 0), 0);
}

async function getClaimedPoints(userId: string): Promise<number> {
  const db = serviceDb();
  const { data } = await db.from('user_offer_claims').select('points_cost').eq('user_id', userId);
  return (data ?? []).reduce((sum, row) => sum + Number(row.points_cost ?? 0), 0);
}

async function findUserByCard(cardCode: string) {
  const code = cardCode.trim();
  if (!code) return null;
  const db = serviceDb();
  const { data, error } = await db
    .from('users')
    .select('id, email, name, lkm_card_code, lkm_access_token')
    .eq('lkm_card_code', code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function listEarnTransactions(accessToken: string, userId: string) {
  const clientToken = await getClientToken(accessToken);
  const raw = await lkmFetch<LkmTransaction[]>('/v2/Transactions/v2', {
    clientToken,
    queryParams: { perPage: 30, page: 1 },
  }).catch(() => [] as LkmTransaction[]);

  const db = serviceDb();
  const { data: already } = await db
    .from('points_reversals')
    .select('lkm_tx_id')
    .eq('user_id', userId)
    .not('lkm_tx_id', 'is', null);
  const reversedIds = new Set((already ?? []).map((r) => String(r.lkm_tx_id)));

  const items = Array.isArray(raw) ? raw : [];
  return items
    .filter((tx) => !tx.IsCanceled)
    .map((tx) => {
      const id = String(tx.COD_TRANSACCAO ?? '');
      const points = Number(tx.Pontos ?? 0);
      return {
        id,
        restaurant: tx.LOJA ?? 'Restaurante',
        date: tx.DATAHORA ?? null,
        amountPaid: Number(tx.Valor_pago ?? tx.Valor_compra ?? 0),
        points,
        alreadyReversed: id ? reversedIds.has(id) : false,
      };
    })
    .filter((tx) => tx.points > 0 && tx.id);
}

async function availableBalance(userId: string, accessToken: string): Promise<number> {
  const clientToken = await getClientToken(accessToken);
  const balanceRaw = await lkmFetch<unknown>('/v2/GetPoints', { clientToken }).catch(() =>
    lkmFetch<unknown>('/v2/Points', { clientToken }),
  );
  const lkmBalance = parseLkmPointsBalance(balanceRaw);
  const claimed = await getClaimedPoints(userId);
  const reversed = await getReversedPoints(userId);
  return Math.max(0, lkmBalance - claimed - reversed);
}

async function handleLookup(cardCode: string) {
  const user = await findUserByCard(cardCode);
  if (!user?.lkm_access_token) {
    return errorResponse('Cliente não encontrado com este cartão.', 404);
  }

  const [transactions, balance] = await Promise.all([
    listEarnTransactions(user.lkm_access_token, user.id),
    availableBalance(user.id, user.lkm_access_token).catch(() => 0),
  ]);

  return jsonResponse(
    {
      cardCode: user.lkm_card_code,
      email: user.email,
      name: user.name,
      balance,
      transactions,
    },
    { headers: corsHeaders },
  );
}

async function handleReverse(opts: {
  adminId: string;
  cardCode: string;
  points?: number;
  lkmTxId?: string;
  reason?: string;
}) {
  const user = await findUserByCard(opts.cardCode);
  if (!user?.lkm_access_token) {
    return errorResponse('Cliente não encontrado com este cartão.', 404);
  }

  let pointsToRemove = Number(opts.points ?? 0);
  let txId = opts.lkmTxId?.trim() || null;
  let restaurant = 'Restaurante';

  if (txId) {
    const txs = await listEarnTransactions(user.lkm_access_token, user.id);
    const match = txs.find((t) => t.id === txId);
    if (!match) {
      return errorResponse('Transação não encontrada ou sem pontos.', 404);
    }
    if (match.alreadyReversed) {
      return errorResponse('Esta transação já foi anulada.', 409);
    }
    pointsToRemove = match.points;
    restaurant = match.restaurant;
  }

  if (!Number.isFinite(pointsToRemove) || pointsToRemove <= 0) {
    return errorResponse('Indique um número de pontos válido (> 0).', 400);
  }

  const balance = await availableBalance(user.id, user.lkm_access_token);
  if (pointsToRemove > balance) {
    return errorResponse(
      `Pontos insuficientes. Disponível: ${balance}, a anular: ${pointsToRemove}`,
      400,
    );
  }

  const db = serviceDb();
  const reason =
    opts.reason?.trim() ||
    (txId ? `Anulação transação ${txId}` : 'Anulação manual (venda cancelada)');

  const { data: reversal, error } = await db
    .from('points_reversals')
    .insert({
      user_id: user.id,
      points: Math.round(pointsToRemove),
      lkm_tx_id: txId,
      reason,
      created_by: opts.adminId,
    })
    .select('id, points, lkm_tx_id, reason, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return errorResponse('Esta transação já foi anulada.', 409);
    }
    throw new Error(error.message);
  }

  await db.from('loyalty_transactions').insert({
    user_id: user.id,
    lkm_tx_id: txId ? `rev-${txId}` : `rev-manual-${reversal.id}`,
    restaurant_name: restaurant,
    points_delta: -Math.round(pointsToRemove),
    description: reason,
    tx_date: new Date().toISOString(),
    type: 'reversal',
  });

  const newBalance = await availableBalance(user.id, user.lkm_access_token).catch(
    () => Math.max(0, balance - pointsToRemove),
  );

  return jsonResponse(
    {
      success: true,
      pointsRemoved: Math.round(pointsToRemove),
      newBalance,
      reversal,
    },
    { headers: corsHeaders },
  );
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { user } = await getSupabaseUser(req);
    await assertAdmin(user.id, user.email);

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const action = url.searchParams.get('action') ?? 'lookup';
      const cardCode = url.searchParams.get('cardCode') ?? '';
      if (action !== 'lookup') return errorResponse('Unknown action', 400);
      return await handleLookup(cardCode);
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as {
        action?: string;
        cardCode?: string;
        points?: number;
        lkmTxId?: string;
        reason?: string;
      };
      if (body.action !== 'reverse') return errorResponse('Unknown action', 400);
      if (!body.cardCode?.trim()) return errorResponse('cardCode is required', 400);
      // touch config so secrets are loaded for LKM calls
      await getLkmConfig();
      return await handleReverse({
        adminId: user.id,
        cardCode: body.cardCode,
        points: body.points,
        lkmTxId: body.lkmTxId,
        reason: body.reason,
      });
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    if ((err as Error).message === 'ADMIN_REQUIRED') {
      return errorResponse('Admin access required', 403);
    }
    if (err instanceof LkmApiError) {
      return errorResponse(err.message, err.status >= 500 ? 502 : err.status);
    }
    console.error('[staff-points]', err);
    return errorResponse((err as Error).message, 500);
  }
});
