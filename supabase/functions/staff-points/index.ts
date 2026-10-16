// staff-points Edge Function
// Admin-only directory, per-user history, lookup by Ganhar QR / card, reverse points.
//
// GET  ?action=directory&q=
// GET  ?action=history&userId=
// GET  ?action=lookup&cardCode=
// POST { action: 'reverse', cardCode?, userId?, points?, lkmTxId?, reason? }

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
  unwrapLkmList,
  getAppPointAdjustments,
  appAvailablePoints,
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

type TxType = 'earn' | 'redeem' | 'credit' | 'reversal';

interface AdminTransaction {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  cardCode: string | null;
  restaurant: string;
  description: string;
  date: string;
  points: number;
  type: TxType;
  expiresAt: string | null;
  amountPaid: number;
  reversible: boolean;
  alreadyReversed: boolean;
}

interface UserRow {
  id: string;
  email: string | null;
  name: string | null;
  lkm_card_code: string | null;
  short_code: string | null;
  created_at: string | null;
  lkm_access_token: string | null;
}

const USER_SELECT =
  'id, email, name, lkm_card_code, short_code, created_at, lkm_access_token';

async function assertAdmin(userId: string, email: string | undefined): Promise<void> {
  const db = serviceDb();
  const { data } = await db.from('users').select('is_admin').eq('id', userId).maybeSingle();
  if (data?.is_admin) return;
  if (email?.trim().toLowerCase() === 'admin@chefdomingos.app') return;
  throw new Error('ADMIN_REQUIRED');
}

function extractCardCode(raw: string): string {
  const trimmed = raw.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  if (!trimmed) return '';
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (typeof parsed === 'string') return extractCardCode(parsed);
    if (parsed && typeof parsed === 'object') {
      const o = parsed as Record<string, unknown>;
      for (const key of ['codCartao', 'CodCartao', 'cardCode', 'code', 'qr', 'value']) {
        if (o[key] != null) return extractCardCode(String(o[key]));
      }
    }
  } catch {
    // not JSON
  }
  return trimmed;
}

function publicUser(row: UserRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    cardCode: row.lkm_card_code,
    shortCode: row.short_code,
    createdAt: row.created_at,
  };
}

function addOneYear(iso: string): string | null {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

function stampTx(
  user: Pick<UserRow, 'id' | 'name' | 'email' | 'lkm_card_code'>,
  tx: Omit<
    AdminTransaction,
    'userId' | 'userName' | 'userEmail' | 'cardCode' | 'reversible' | 'alreadyReversed' | 'amountPaid'
  > & { amountPaid?: number; reversible?: boolean; alreadyReversed?: boolean },
): AdminTransaction {
  return {
    ...tx,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    cardCode: user.lkm_card_code,
    amountPaid: tx.amountPaid ?? 0,
    reversible: tx.reversible ?? false,
    alreadyReversed: tx.alreadyReversed ?? false,
  };
}

function mapLkmTransaction(
  user: UserRow,
  tx: LkmTransaction,
  reversedIds: Set<string>,
): AdminTransaction | null {
  if (tx.IsCanceled) return null;
  const earned = Number(tx.Pontos ?? 0);
  const redeemed = Number(tx.Pontos_resgatados ?? 0);
  const date = tx.DATAHORA ?? new Date().toISOString();
  const id = String(tx.COD_TRANSACCAO ?? `lkm-${date}`);
  const restaurant = tx.LOJA ?? 'Restaurante';
  const amountPaid = Number(tx.Valor_pago ?? tx.Valor_compra ?? 0);

  if (redeemed > 0 && earned <= 0) {
    return stampTx(user, {
      id,
      restaurant,
      description: 'Resgate',
      date,
      points: -Math.abs(redeemed),
      type: 'redeem',
      expiresAt: null,
      amountPaid,
    });
  }

  if (earned === 0 && redeemed === 0) return null;
  const alreadyReversed = Boolean(id) && reversedIds.has(id);
  return stampTx(user, {
    id,
    restaurant,
    description: 'Compra faturada',
    date,
    points: earned,
    type: 'earn',
    expiresAt: addOneYear(date),
    amountPaid,
    reversible: earned > 0 && Boolean(id) && !alreadyReversed,
    alreadyReversed,
  });
}

function mapLocalRow(
  user: UserRow,
  row: {
    id: string;
    restaurant_name: string | null;
    description: string | null;
    tx_date: string;
    points_delta: number;
    type: string;
    lkm_tx_id: string | null;
  },
): AdminTransaction {
  const type = (['earn', 'redeem', 'credit', 'reversal'].includes(row.type)
    ? row.type
    : row.points_delta >= 0
      ? 'earn'
      : 'redeem') as TxType;
  const date = row.tx_date;
  return stampTx(user, {
    id: String(row.lkm_tx_id ?? row.id),
    restaurant: row.restaurant_name ?? 'Chef Domingos',
    description:
      row.description ??
      (type === 'credit' ? 'Carregamento' : type === 'reversal' ? 'Anulação' : 'Movimento'),
    date,
    points: Number(row.points_delta),
    type,
    expiresAt: type === 'earn' || type === 'credit' ? addOneYear(date) : null,
  });
}

async function findUserByCard(cardCode: string): Promise<UserRow | null> {
  const code = extractCardCode(cardCode);
  if (!code) return null;
  const db = serviceDb();

  const { data: byCard } = await db.from('users').select(USER_SELECT).eq('lkm_card_code', code).maybeSingle();
  if (byCard) return byCard as UserRow;

  const { data: byShort } = await db.from('users').select(USER_SELECT).eq('short_code', code).maybeSingle();
  if (byShort) return byShort as UserRow;

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code)) {
    const { data: byId } = await db.from('users').select(USER_SELECT).eq('id', code).maybeSingle();
    if (byId) return byId as UserRow;
  }
  return null;
}

async function findUserById(userId: string): Promise<UserRow | null> {
  const db = serviceDb();
  const { data, error } = await db.from('users').select(USER_SELECT).eq('id', userId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as UserRow | null) ?? null;
}

async function reversedLkmIds(userId: string): Promise<Set<string>> {
  const db = serviceDb();
  const { data } = await db
    .from('points_reversals')
    .select('lkm_tx_id')
    .eq('user_id', userId)
    .not('lkm_tx_id', 'is', null);
  return new Set((data ?? []).map((r) => String(r.lkm_tx_id)));
}

async function fetchLkmMapped(user: UserRow): Promise<AdminTransaction[]> {
  if (!user.lkm_access_token) return [];
  const reversedIds = await reversedLkmIds(user.id);
  try {
    const clientToken = await getClientToken(user.lkm_access_token);
    let raw: unknown = [];
    try {
      raw = await lkmFetch<unknown>('/v2/Transactions/v2', {
        clientToken,
        queryParams: { perPage: 50, page: 1, contaCartao: true },
      });
    } catch {
      raw = await lkmFetch<unknown>('/v2/Transactions/CardTransactions', {
        clientToken,
        queryParams: { perPage: 50, page: 1, contaCartao: true },
      }).catch(() => []);
    }
    return unwrapLkmList<LkmTransaction>(raw)
      .map((tx) => mapLkmTransaction(user, tx, reversedIds))
      .filter((tx): tx is AdminTransaction => Boolean(tx) && tx.points !== 0);
  } catch (err) {
    console.warn('[staff-points] LKM txs failed', user.id, err);
    return [];
  }
}

async function fetchLocalHistory(users: UserRow[]): Promise<AdminTransaction[]> {
  if (users.length === 0) return [];
  const db = serviceDb();
  const byId = new Map(users.map((u) => [u.id, u]));
  const ids = users.map((u) => u.id);

  const [{ data: localRows }, { data: claims }, { data: credits }] = await Promise.all([
    db
      .from('loyalty_transactions')
      .select('id, user_id, restaurant_name, description, tx_date, points_delta, type, lkm_tx_id')
      .in('user_id', ids)
      .order('tx_date', { ascending: false })
      .limit(400),
    db
      .from('user_offer_claims')
      .select('id, user_id, points_cost, claimed_at, offer_id')
      .in('user_id', ids),
    db.from('points_credits').select('id, user_id, points, reason, created_at').in('user_id', ids),
  ]);

  const offerIds = [...new Set((claims ?? []).map((c) => String(c.offer_id)).filter(Boolean))];
  const offerTitle = new Map<string, string>();
  if (offerIds.length) {
    const { data: offers } = await db.from('reward_offers').select('id, title').in('id', offerIds);
    for (const offer of offers ?? []) {
      offerTitle.set(String(offer.id), String(offer.title ?? ''));
    }
  }

  const out: AdminTransaction[] = [];
  for (const row of localRows ?? []) {
    const user = byId.get(String((row as { user_id: string }).user_id));
    if (!user) continue;
    out.push(mapLocalRow(user, row as Parameters<typeof mapLocalRow>[1]));
  }

  const seen = new Set(out.map((t) => t.id));

  for (const row of credits ?? []) {
    const user = byId.get(String(row.user_id));
    if (!user) continue;
    const id = `credit-${row.id}`;
    const createdAt = String(row.created_at ?? '');
    const points = Number(row.points ?? 0);
    const duplicate = out.some(
      (t) =>
        t.userId === user.id &&
        t.type === 'credit' &&
        t.points === points &&
        Math.abs(new Date(t.date).getTime() - new Date(createdAt).getTime()) < 5000,
    );
    if (duplicate || seen.has(id)) continue;
    seen.add(id);
    out.push(
      stampTx(user, {
        id,
        restaurant: 'Chef Domingos',
        description: String(row.reason ?? 'Carregamento'),
        date: createdAt,
        points,
        type: 'credit',
        expiresAt: addOneYear(createdAt),
      }),
    );
  }

  for (const row of claims ?? []) {
    const user = byId.get(String(row.user_id));
    if (!user) continue;
    const id = `claim-${row.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const title = offerTitle.get(String(row.offer_id));
    const date = String(row.claimed_at ?? new Date().toISOString());
    out.push(
      stampTx(user, {
        id,
        restaurant: 'Chef Domingos',
        description: title ? `Resgate: ${title}` : 'Resgate de vale',
        date,
        points: -Math.abs(Number(row.points_cost ?? 0)),
        type: 'redeem',
        expiresAt: null,
      }),
    );
  }

  return out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function matchesQuery(user: UserRow, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return [
    user.name,
    user.email,
    user.id,
    user.lkm_card_code,
    user.short_code,
  ]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(needle));
}

async function availableBalance(userId: string, accessToken: string | null): Promise<number> {
  let lkmBalance = 0;
  if (accessToken) {
    try {
      const clientToken = await getClientToken(accessToken);
      const balanceRaw = await lkmFetch<unknown>('/v2/GetPoints', { clientToken }).catch(() =>
        lkmFetch<unknown>('/v2/Points', { clientToken }),
      );
      lkmBalance = parseLkmPointsBalance(balanceRaw);
    } catch (err) {
      console.warn('[staff-points] balance failed', userId, err);
    }
  }
  const adj = await getAppPointAdjustments(userId);
  return appAvailablePoints(lkmBalance, adj);
}

function earnRows(history: AdminTransaction[]) {
  return history
    .filter((tx) => tx.type === 'earn' && tx.points > 0)
    .map((tx) => ({
      id: tx.id,
      restaurant: tx.restaurant,
      date: tx.date,
      amountPaid: tx.amountPaid,
      points: tx.points,
      alreadyReversed: tx.alreadyReversed,
    }));
}

async function buildCustomerPayload(user: UserRow) {
  const [lkmTxs, localTxs, balance] = await Promise.all([
    fetchLkmMapped(user),
    fetchLocalHistory([user]),
    availableBalance(user.id, user.lkm_access_token).catch(() => 0),
  ]);
  const seen = new Set(lkmTxs.map((t) => t.id));
  const history = [...lkmTxs, ...localTxs.filter((t) => !seen.has(t.id))].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  return {
    userId: user.id,
    cardCode: user.lkm_card_code,
    email: user.email,
    name: user.name,
    balance,
    history,
    transactions: earnRows(history),
  };
}

async function handleDirectory(q: string) {
  const db = serviceDb();
  const { data, error } = await db
    .from('users')
    .select(USER_SELECT)
    .order('name', { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);

  const all = (data ?? []) as UserRow[];
  const users = all.filter((u) => matchesQuery(u, q));

  const localTxs = await fetchLocalHistory(users);
  const lkmSettled = await Promise.allSettled(users.map((u) => fetchLkmMapped(u)));
  const lkmTxs = lkmSettled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  const seen = new Set(lkmTxs.map((t) => `${t.userId}:${t.id}`));
  const transactions = [
    ...lkmTxs,
    ...localTxs.filter((t) => !seen.has(`${t.userId}:${t.id}`)),
  ]
    .filter((t) => matchesQuery(
      {
        id: t.userId,
        name: t.userName,
        email: t.userEmail,
        lkm_card_code: t.cardCode,
        short_code: null,
        created_at: null,
        lkm_access_token: null,
      },
      q,
    ))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 200);

  return jsonResponse(
    {
      users: users.map(publicUser),
      transactions,
    },
    { headers: corsHeaders },
  );
}

async function handleHistory(userId: string) {
  const user = await findUserById(userId);
  if (!user) return errorResponse('Cliente não encontrado.', 404);
  return jsonResponse(await buildCustomerPayload(user), { headers: corsHeaders });
}

async function handleLookup(cardCode: string) {
  const user = await findUserByCard(cardCode);
  if (!user) {
    return errorResponse('Cliente não encontrado com este cartão.', 404);
  }
  return jsonResponse(await buildCustomerPayload(user), { headers: corsHeaders });
}

async function handleReverse(opts: {
  adminId: string;
  cardCode?: string;
  userId?: string;
  points?: number;
  lkmTxId?: string;
  reason?: string;
}) {
  const user = opts.userId
    ? await findUserById(opts.userId)
    : opts.cardCode
      ? await findUserByCard(opts.cardCode)
      : null;
  if (!user) {
    return errorResponse('Cliente não encontrado com este cartão.', 404);
  }

  let pointsToRemove = Number(opts.points ?? 0);
  let txId = opts.lkmTxId?.trim() || null;
  let restaurant = 'Restaurante';

  if (txId) {
    const lkmTxs = await fetchLkmMapped(user);
    const match = lkmTxs.find((t) => t.id === txId && t.type === 'earn' && t.points > 0);
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
      if (action === 'directory') {
        await getLkmConfig();
        return await handleDirectory(url.searchParams.get('q') ?? '');
      }
      if (action === 'history') {
        const userId = url.searchParams.get('userId') ?? '';
        if (!userId) return errorResponse('userId is required', 400);
        await getLkmConfig();
        return await handleHistory(userId);
      }
      if (action === 'lookup') {
        const cardCode = url.searchParams.get('cardCode') ?? '';
        await getLkmConfig();
        return await handleLookup(cardCode);
      }
      return errorResponse('Unknown action', 400);
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as {
        action?: string;
        cardCode?: string;
        userId?: string;
        points?: number;
        lkmTxId?: string;
        reason?: string;
      };
      if (body.action !== 'reverse') return errorResponse('Unknown action', 400);
      if (!body.cardCode?.trim() && !body.userId?.trim()) {
        return errorResponse('cardCode or userId is required', 400);
      }
      await getLkmConfig();
      return await handleReverse({
        adminId: user.id,
        cardCode: body.cardCode,
        userId: body.userId,
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
