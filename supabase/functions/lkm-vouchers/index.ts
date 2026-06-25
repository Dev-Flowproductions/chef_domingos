// lkm-vouchers Edge Function
// GET  /lkm-vouchers?action=catalog          → reward catalog
// GET  /lkm-vouchers?action=list             → user's active vouchers
// POST /lkm-vouchers  { action: 'claim', codCatalog }   → claim reward
// POST /lkm-vouchers  { action: 'validate', codVoucher, codLoja } → staff validation
// POST /lkm-vouchers  { action: 'activate', codVale }   → activate a PANS promotion voucher

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import {
  lkmFetch,
  getClientToken,
  getSupabaseUser,
  getLkmCard,
  getLkmConfig,
  serviceDb,
  jsonResponse,
  errorResponse,
  LkmApiError,
} from '../_shared/lkm-client.ts';

// ── Catalog ───────────────────────────────────────────────────────────────────

interface LkmCatalogItem {
  CodCatalog?:  string | number;
  Descricao?:   string;
  Pontos?:      number;
  Imagem?:      string;
  NomeLoja?:    string;
  CodLoja?:     string;
  DataValidade?: string;
  [key: string]: unknown;
}

interface AppCatalogItem {
  id:             string;
  title:          string;
  description:    string;
  pointsCost:     number;
  imageUrl:       string;
  restaurantName: string;
  restaurantId:   string;
  expiresAt:      string | null;
}

function mapCatalogItem(item: LkmCatalogItem): AppCatalogItem {
  return {
    id:             String(item.CodCatalog ?? ''),
    title:          String(item.Descricao ?? 'Oferta'),
    description:    String(item.Descricao ?? ''),
    pointsCost:     Number(item.Pontos ?? 0),
    imageUrl:       String(item.Imagem ?? ''),
    restaurantName: String(item.NomeLoja ?? 'Chef Domingos'),
    restaurantId:   String(item.CodLoja ?? ''),
    expiresAt:      item.DataValidade ? String(item.DataValidade) : null,
  };
}

async function getCatalog(clientToken: string): Promise<AppCatalogItem[]> {
  const raw = await lkmFetch<LkmCatalogItem[] | { Data?: LkmCatalogItem[] }>(
    '/v2/Vouchers/GetCatalog',
    { clientToken },
  );

  const items: LkmCatalogItem[] = Array.isArray(raw)
    ? raw
    : (raw as any).Data ?? [];

  return items.map(mapCatalogItem);
}

// ── User's voucher list ───────────────────────────────────────────────────────

interface LkmVoucher {
  CodVale?:      string | number;
  Descricao?:    string;
  Estado?:       string;
  DataValidade?: string;
  DataActivacao?: string;
  NomeLoja?:     string;
  Pontos?:       number;
  [key: string]: unknown;
}

interface AppVoucher {
  id:             string;
  title:          string;
  state:          'active' | 'used' | 'expired' | 'pending';
  restaurantName: string;
  pointsCost:     number;
  expiresAt:      string | null;
  activeFrom:     string | null;
  qrValue:        string;
}

function mapVoucher(v: LkmVoucher): AppVoucher {
  const stateMap: Record<string, AppVoucher['state']> = {
    Ativo:     'active',
    Activo:    'active',
    Utilizado: 'used',
    Expirado:  'expired',
    Pendente:  'pending',
  };

  return {
    id:             String(v.CodVale ?? ''),
    title:          String(v.Descricao ?? 'Voucher'),
    state:          stateMap[String(v.Estado ?? '')] ?? 'active',
    restaurantName: String(v.NomeLoja ?? 'Chef Domingos'),
    pointsCost:     Number(v.Pontos ?? 0),
    expiresAt:      v.DataValidade ? String(v.DataValidade) : null,
    activeFrom:     v.DataActivacao ? String(v.DataActivacao) : null,
    qrValue:        String(v.CodVale ?? ''),
  };
}

async function getVoucherList(clientToken: string): Promise<AppVoucher[]> {
  const raw = await lkmFetch<LkmVoucher[] | { Data?: LkmVoucher[] }>(
    '/v2/Vouchers/ClientList',
    {
      clientToken,
      queryParams: { ValeStateEnum: 'Ativo', perPage: 50, page: 1 },
    },
  );

  const items: LkmVoucher[] = Array.isArray(raw)
    ? raw
    : (raw as any).Data ?? [];

  return items.map(mapVoucher);
}

// ── Claim (create voucher from catalog) ───────────────────────────────────────

async function claimVoucher(
  userId: string,
  clientToken: string,
  codCatalog: string,
): Promise<AppVoucher> {
  const result = await lkmFetch<LkmVoucher | { Vale?: LkmVoucher }>(
    '/v2/Vouchers/ClientCreateVale',
    { method: 'POST', clientToken, body: { CodCatalog: codCatalog } },
  );

  const voucher: LkmVoucher = (result as any).Vale ?? result as LkmVoucher;

  // Persist to local DB
  const db = serviceDb();
  await db.from('vouchers').insert({
    user_id:        userId,
    lkm_voucher_id: String(voucher.CodVale ?? ''),
    title:          String(voucher.Descricao ?? 'Voucher'),
    points_cost:    Number(voucher.Pontos ?? 0),
    restaurant_name: String(voucher.NomeLoja ?? 'Chef Domingos'),
    state:          'active',
    expires_at:     voucher.DataValidade ?? null,
    active_from:    voucher.DataActivacao ?? null,
    qr_value:       String(voucher.CodVale ?? ''),
  });

  return mapVoucher(voucher);
}

// ── Staff: validate voucher ───────────────────────────────────────────────────

async function validateVoucher(
  clientToken: string | undefined,
  codVoucher: string,
  codLoja: string,
): Promise<{ status: 'valid' | 'already_used' | 'expired' | 'not_active'; title: string }> {
  // Check voucher state first
  const voucher = await lkmFetch<LkmVoucher>(
    '/v2/Vouchers/Voucher',
    { clientToken, queryParams: { CodVoucher: codVoucher } },
  );

  const now      = new Date();
  const expiry   = voucher.DataValidade ? new Date(String(voucher.DataValidade)) : null;
  const activeAt = voucher.DataActivacao ? new Date(String(voucher.DataActivacao)) : null;
  const estado   = String(voucher.Estado ?? '');

  if (['Utilizado', 'Used'].includes(estado)) {
    return { status: 'already_used', title: String(voucher.Descricao ?? '') };
  }
  if (expiry && now > expiry) {
    return { status: 'expired', title: String(voucher.Descricao ?? '') };
  }
  if (activeAt && now < activeAt) {
    return { status: 'not_active', title: String(voucher.Descricao ?? '') };
  }

  // Mark as redeemed in LKM
  await lkmFetch('/v2/Vouchers/ClientRedeem', {
    method: 'POST',
    clientToken,
    body: { CodVoucher: codVoucher, CodLoja: codLoja },
  });

  // Update local DB
  const db = serviceDb();
  await db
    .from('vouchers')
    .update({ state: 'used', used_at: now.toISOString() })
    .eq('lkm_voucher_id', codVoucher);

  return { status: 'valid', title: String(voucher.Descricao ?? '') };
}

// ── Activate PANS promotion voucher ──────────────────────────────────────────

async function activateVoucher(clientToken: string, codVale: string) {
  await lkmFetch('/v2/Vouchers/ActivePromotionVoucher', {
    method: 'POST',
    clientToken,
    body: { codVale },
  });
  return { activated: true };
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { user } = await getSupabaseUser(req);
    const { storeId: LKM_STORE_ID } = await getLkmConfig();

    if (req.method === 'GET') {
      const { accessToken } = await getLkmCard(user.id);
      const clientToken = await getClientToken(accessToken);
      const url    = new URL(req.url);
      const action = url.searchParams.get('action') ?? 'catalog';

      if (action === 'catalog') {
        const catalog = await getCatalog(clientToken);
        return jsonResponse({ catalog }, { headers: corsHeaders });
      }

      if (action === 'list') {
        const vouchers = await getVoucherList(clientToken);
        return jsonResponse({ vouchers }, { headers: corsHeaders });
      }

      return errorResponse('Unknown action. Use catalog or list.');
    }

    if (req.method === 'POST') {
      const body: Record<string, unknown> = await req.json();
      const { action, ...rest } = body;

      if (action === 'validateStaff') {
        const codLoja = String(rest.codLoja ?? LKM_STORE_ID);
        const result = await validateVoucher(undefined, String(rest.codVoucher), codLoja);
        return jsonResponse(result, { headers: corsHeaders });
      }

      const { accessToken } = await getLkmCard(user.id);
      const clientToken = await getClientToken(accessToken);

      if (action === 'claim') {
        const voucher = await claimVoucher(user.id, clientToken, String(rest.codCatalog));
        return jsonResponse({ voucher }, { headers: corsHeaders });
      }

      if (action === 'validate') {
        const codLoja = String(rest.codLoja ?? LKM_STORE_ID);
        const result  = await validateVoucher(clientToken, String(rest.codVoucher), codLoja);
        return jsonResponse(result, { headers: corsHeaders });
      }

      if (action === 'activate') {
        const result = await activateVoucher(clientToken, String(rest.codVale));
        return jsonResponse(result, { headers: corsHeaders });
      }

      return errorResponse('Unknown action. Use claim, validate, validateStaff, or activate.');
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    if (err instanceof LkmApiError) {
      return errorResponse(err.message, err.status >= 500 ? 502 : err.status);
    }
    console.error('[lkm-vouchers]', err);
    return errorResponse((err as Error).message, 500);
  }
});
