// lkm-scan Edge Function
// Called by staff when they scan a customer's "Ganhar" QR code at the counter.
// POST /lkm-scan { transactionId: string, storeId?: string }
//   → { success, pointsEarned, newBalance }

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

const LKM_STORE_ID = Deno.env.get('LKM_STORE_EXTERNAL_ID')!;

// POST /v2/Transactions body is IdStringInput: { id: string }
// Response is a TransactionsHistoryResponse (or similar) with points info
interface LkmTransactionResult {
  Pontos?:            number;   // points earned on this transaction
  Pontos_resgatados?: number;
  COD_TRANSACCAO?:    number;
  LOJA?:              string;
  Mensagem?:          string;
  [key: string]:      unknown;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { user } = await getSupabaseUser(req);
    const { cardCode, accessToken } = await getLkmCard(user.id);
    const clientToken = await getClientToken(accessToken);

    const body: { transactionId?: string; storeId?: string } = await req.json();
    const { transactionId, storeId = LKM_STORE_ID } = body;

    if (!transactionId) {
      return errorResponse('transactionId is required', 400);
    }

    // Register transaction against the customer's card in LKM
    // Body: IdStringInput { id: string } per LKM spec
    const result = await lkmFetch<LkmTransactionResult>(
      '/v2/Transactions',
      {
        method: 'POST',
        clientToken,
        body: { id: transactionId },
      },
    );

    const pointsEarned = Number(result.Pontos ?? 0);
    // Fetch fresh balance after transaction (LKM scan response doesn't include total balance)
    const newBalance = await lkmFetch<number>('/v2/Points', { clientToken }).then(Number).catch(() => 0);

    // Cache the transaction locally
    if (pointsEarned > 0) {
      const db = serviceDb();
      await db.from('loyalty_transactions').insert({
        user_id:         user.id,
        lkm_tx_id:       String(transactionId),
        restaurant_name: result.LOJA ?? 'Restaurante',
        points_delta:    pointsEarned,
        description:     'Compra',
        tx_date:         new Date().toISOString(),
        type:            'earn',
      });
    }

    return jsonResponse(
      {
        success:      true,
        pointsEarned,
        newBalance,
        cardCode,
        message:      result.Mensagem ?? `+${pointsEarned} pontos adicionados!`,
      },
      { headers: corsHeaders },
    );
  } catch (err) {
    if (err instanceof LkmApiError) {
      // 409 = receipt already processed
      if (err.status === 409) {
        return errorResponse('Este talão já foi utilizado para acumular pontos.', 409);
      }
      return errorResponse(err.message, err.status >= 500 ? 502 : err.status);
    }
    console.error('[lkm-scan]', err);
    return errorResponse((err as Error).message, 500);
  }
});
