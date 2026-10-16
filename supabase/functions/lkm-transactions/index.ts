// lkm-transactions Edge Function
// GET /lkm-transactions?filter=todos|ganhos|usados&page=1&perPage=20

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import {
  lkmFetch,
  getClientToken,
  getSupabaseUser,
  getLkmCard,
  jsonResponse,
  errorResponse,
  LkmApiError,
  unwrapLkmList,
  serviceDb,
} from '../_shared/lkm-client.ts';

interface LkmTransaction {
  COD_TRANSACCAO?:     number;
  COD_LOJA?:           string;
  LOJA?:               string;
  DATAHORA?:           string;
  Valor_compra?:       number;
  Valor_pago?:         number;
  Pontos?:             number;
  Pontos_resgatados?:  number;
  Classificacao?:      number;
  IsCanceled?:         boolean;
  [key: string]:       unknown;
}

interface AppTransaction {
  id:          string;
  restaurant:  string;
  description: string;
  date:        string;
  points:      number;
  type:        'earn' | 'redeem' | 'credit' | 'reversal';
  expiresAt:   string | null;
}

function addOneYear(iso: string): string | null {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

function mapTransaction(tx: LkmTransaction): AppTransaction {
  const earned   = Number(tx.Pontos ?? 0);
  const redeemed = Number(tx.Pontos_resgatados ?? 0);
  const date     = tx.DATAHORA ?? new Date().toISOString();

  if (redeemed > 0 && earned <= 0) {
    return {
      id:          String(tx.COD_TRANSACCAO ?? `lkm-${date}`),
      restaurant:  tx.LOJA ?? 'Restaurante',
      description: 'Resgate',
      date,
      points:      -Math.abs(redeemed),
      type:        'redeem',
      expiresAt:   null,
    };
  }

  return {
    id:          String(tx.COD_TRANSACCAO ?? `lkm-${date}`),
    restaurant:  tx.LOJA ?? 'Restaurante',
    description: 'Compra faturada',
    date,
    points:      earned,
    type:        'earn',
    expiresAt:   addOneYear(date),
  };
}

function mapLocalRow(row: {
  id: string;
  restaurant_name: string | null;
  description: string | null;
  tx_date: string;
  points_delta: number;
  type: string;
  lkm_tx_id: string | null;
}): AppTransaction {
  const type = (['earn', 'redeem', 'credit', 'reversal'].includes(row.type)
    ? row.type
    : row.points_delta >= 0
      ? 'earn'
      : 'redeem') as AppTransaction['type'];
  const date = row.tx_date;
  return {
    id: String(row.lkm_tx_id ?? row.id),
    restaurant: row.restaurant_name ?? 'Chef Domingos',
    description: row.description ?? (type === 'credit' ? 'Carregamento' : type === 'reversal' ? 'Anulação' : 'Movimento'),
    date,
    points: Number(row.points_delta),
    type,
    expiresAt: type === 'earn' || type === 'credit' ? addOneYear(date) : null,
  };
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { user } = await getSupabaseUser(req);
    const { accessToken } = await getLkmCard(user.id);
    const clientToken = await getClientToken(accessToken);

    const url     = new URL(req.url);
    const filter  = url.searchParams.get('filter') ?? 'todos';
    const page    = Number(url.searchParams.get('page') ?? '1');
    const perPage = Number(url.searchParams.get('perPage') ?? '20');

    let raw: unknown = [];
    try {
      raw = await lkmFetch<unknown>('/v2/Transactions/v2', {
        clientToken,
        queryParams: { perPage, page, contaCartao: true },
      });
    } catch (firstErr) {
      console.warn('[lkm-transactions] v2 fallback CardTransactions', firstErr);
      try {
        raw = await lkmFetch<unknown>('/v2/Transactions/CardTransactions', {
          clientToken,
          queryParams: { perPage, page, contaCartao: true },
        });
      } catch (secondErr) {
        console.warn('[lkm-transactions] CardTransactions failed', secondErr);
        raw = [];
      }
    }

    const items = unwrapLkmList<LkmTransaction>(raw);

    const lkmTxs: AppTransaction[] = items
      .filter((tx) => !tx.IsCanceled)
      .map(mapTransaction)
      .filter((t) => t.points !== 0);

    const db = serviceDb();
    const [{ data: localRows }, { data: claims }] = await Promise.all([
      db
        .from('loyalty_transactions')
        .select('id, restaurant_name, description, tx_date, points_delta, type, lkm_tx_id')
        .eq('user_id', user.id)
        .order('tx_date', { ascending: false })
        .limit(100),
      db
        .from('user_offer_claims')
        .select('id, points_cost, claimed_at, offer_id')
        .eq('user_id', user.id),
    ]);

    const offerIds = [...new Set((claims ?? []).map((c) => String(c.offer_id)).filter(Boolean))];
    const offerTitle = new Map<string, string>();
    if (offerIds.length) {
      const { data: offers } = await db.from('reward_offers').select('id, title').in('id', offerIds);
      for (const offer of offers ?? []) {
        offerTitle.set(String(offer.id), String(offer.title ?? ''));
      }
    }

    const seen = new Set(lkmTxs.map((t) => t.id));
    const localTxs = (localRows ?? [])
      .map(mapLocalRow)
      .filter((t) => !seen.has(t.id));
    for (const t of localTxs) seen.add(t.id);

    const claimTxs: AppTransaction[] = [];
    for (const row of claims ?? []) {
      const id = `claim-${row.id}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const title = offerTitle.get(String(row.offer_id));
      const date = String(row.claimed_at ?? new Date().toISOString());
      claimTxs.push({
        id,
        restaurant: 'Chef Domingos',
        description: title ? `Resgate: ${title}` : 'Resgate de vale',
        date,
        points: -Math.abs(Number(row.points_cost ?? 0)),
        type: 'redeem',
        expiresAt: null,
      });
    }

    let transactions = [...lkmTxs, ...localTxs, ...claimTxs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    if (filter === 'ganhos') {
      transactions = transactions.filter((t) => t.points > 0);
    } else if (filter === 'usados') {
      transactions = transactions.filter((t) => t.points < 0);
    }

    const start = Math.max(0, (page - 1) * perPage);
    transactions = transactions.slice(start, start + perPage);

    return jsonResponse(
      { transactions, page, perPage, filter },
      { headers: corsHeaders },
    );
  } catch (err) {
    if (err instanceof LkmApiError) {
      return errorResponse(err.message, err.status >= 500 ? 502 : err.status);
    }
    console.error('[lkm-transactions]', err);
    return errorResponse((err as Error).message, 500);
  }
});
