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
} from '../_shared/lkm-client.ts';

// TransactionsHistoryResponse fields from LKM API spec (Section 5 — Models)
interface LkmTransaction {
  COD_TRANSACCAO?:     number;
  COD_LOJA?:           string;
  LOJA?:               string;
  DATAHORA?:           string;
  Valor_compra?:       number;
  Valor_pago?:         number;
  Pontos?:             number;   // points earned
  Pontos_resgatados?:  number;   // points redeemed
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
  type:        'earn' | 'redeem';
}

function mapTransaction(tx: LkmTransaction): AppTransaction {
  const earned   = Number(tx.Pontos ?? 0);
  const redeemed = Number(tx.Pontos_resgatados ?? 0);
  const isEarn   = earned > 0 || redeemed === 0;

  return {
    id:          String(tx.COD_TRANSACCAO ?? Math.random()),
    restaurant:  tx.LOJA ?? 'Restaurante',
    description: isEarn ? 'Compra' : 'Resgate',
    date:        tx.DATAHORA ?? new Date().toISOString(),
    points:      isEarn ? earned : -Math.abs(redeemed),
    type:        isEarn ? 'earn' : 'redeem',
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

    // Use /v2/Transactions/v2 which returns array of TransactionsHistoryResponse directly
    const raw = await lkmFetch<LkmTransaction[]>(
      '/v2/Transactions/v2',
      {
        clientToken,
        queryParams: { perPage, page },
      },
    );

    const items: LkmTransaction[] = Array.isArray(raw) ? raw : [];

    let transactions = items.map(mapTransaction);

    // Client-side filter (LKM v2 endpoint doesn't always support server-side filter for earn/redeem)
    if (filter === 'ganhos') {
      transactions = transactions.filter((t) => t.type === 'earn');
    } else if (filter === 'usados') {
      transactions = transactions.filter((t) => t.type === 'redeem');
    }

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
