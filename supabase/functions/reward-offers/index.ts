// reward-offers Edge Function
// GET  ?action=catalog&kind=money|promo  → till catalog (money prizes already in Mytarget)
// GET  ?action=list                      → user's vouchers
// GET  ?action=admin-list
// GET  ?action=visibility
// POST setVisibility / activateCatalog / claim / deactivate / validateLocal / unvalidateLocal

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  return null;
}

function serviceDb() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

async function getSupabaseUser(req: Request) {
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  if (!token) throw new Error('Missing Authorization header');
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new Error('Invalid or expired session');
  return { user: data.user, token };
}

function jsonResponse(
  data: unknown,
  init: ResponseInit & { headers?: Record<string, string> } = {},
) {
  const { headers = {}, ...rest } = init;
  return new Response(JSON.stringify(data), {
    status: 200,
    ...rest,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

type OfferKind = 'money' | 'promo';

const MONEY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

async function isUserAdmin(userId: string, email?: string): Promise<boolean> {
  if (email?.trim().toLowerCase() === 'admin@chefdomingos.app') return true;
  const db = serviceDb();
  const { data, error } = await db.from('users').select('is_admin').eq('id', userId).maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data?.is_admin);
}

function extractVoucherCode(raw: string): string {
  const trimmed = raw.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  if (!trimmed) return '';
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (typeof parsed === 'string') return extractVoucherCode(parsed);
    if (parsed && typeof parsed === 'object') {
      const o = parsed as Record<string, unknown>;
      for (const key of [
        'codVoucher',
        'CodVoucher',
        'code',
        'qr',
        'qrValue',
        'value',
        'codCartao',
        'CodCartao',
        'cardCode',
      ]) {
        if (o[key] != null) return extractVoucherCode(String(o[key]));
      }
    }
  } catch {
    // not JSON
  }
  const compact = trimmed.toUpperCase().replace(/\s+/g, '');
  const match = compact.match(/VD-[A-Z0-9]{4}-[A-Z0-9]{4}/);
  if (match) return match[0];
  return compact;
}

type PosDiscountKind = 'money' | 'percent' | 'article';

type PosDiscount = {
  id: string;
  kind: PosDiscountKind;
  pointsCost: number | null;
  euroValue: number | null;
  tillReady: boolean;
};

/** Keep in sync with src/lib/posDiscountCatalog.ts */
const POS_DISCOUNT_CATALOG: readonly PosDiscount[] = [
  { id: 'money-5', kind: 'money', pointsCost: 500, euroValue: 5, tillReady: true },
  { id: 'money-10', kind: 'money', pointsCost: 900, euroValue: 10, tillReady: true },
  { id: 'money-20', kind: 'money', pointsCost: 1700, euroValue: 20, tillReady: true },
  { id: 'money-30', kind: 'money', pointsCost: 2500, euroValue: 30, tillReady: true },
  { id: 'percent-10', kind: 'percent', pointsCost: 400, euroValue: null, tillReady: true },
  { id: 'percent-20', kind: 'percent', pointsCost: 700, euroValue: null, tillReady: true },
  { id: 'percent-30', kind: 'percent', pointsCost: 1000, euroValue: null, tillReady: true },
  { id: 'special-romantic', kind: 'article', pointsCost: 600, euroValue: null, tillReady: true },
  { id: 'special-friends', kind: 'article', pointsCost: 650, euroValue: null, tillReady: true },
];

function isPosMoneyPrize(euro: number, pts: number): boolean {
  return POS_DISCOUNT_CATALOG.some(
    (discount) =>
      discount.kind === 'money' &&
      discount.tillReady &&
      discount.euroValue === euro &&
      discount.pointsCost === pts,
  );
}

function findPosDiscount(id: string): PosDiscount | undefined {
  return POS_DISCOUNT_CATALOG.find((discount) => discount.id === id);
}

type DiscountVisibility = { hidden: boolean; visibleFrom: string | null };

function defaultDiscountHidden(kind: PosDiscountKind): boolean {
  switch (kind) {
    case 'money':
      return false;
    case 'percent':
    case 'article':
      return true;
    default: {
      const unexpected: never = kind;
      return unexpected;
    }
  }
}

function lisbonToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Lisbon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function isDiscountVisible(
  discount: PosDiscount,
  visibility: DiscountVisibility | undefined,
  today: string,
): boolean {
  const hidden = visibility?.hidden ?? defaultDiscountHidden(discount.kind);
  if (hidden) return false;
  const from = visibility?.visibleFrom;
  if (!from) return true;
  return from <= today;
}

function parseIsoDate(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Invalid date');
  }
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error('Invalid date');
  }
  return value;
}

async function listVisibility(): Promise<Map<string, DiscountVisibility>> {
  const db = serviceDb();
  const { data, error } = await db
    .from('pos_discount_visibility')
    .select('catalog_id, hidden, visible_from');
  if (error) {
    console.warn('[reward-offers] visibility', error.message);
    return new Map();
  }
  const map = new Map<string, DiscountVisibility>();
  for (const row of data ?? []) {
    map.set(String(row.catalog_id), {
      hidden: Boolean(row.hidden),
      visibleFrom: row.visible_from ? String(row.visible_from).slice(0, 10) : null,
    });
  }
  return map;
}

async function setVisibility(catalogKey: string, hidden: unknown, visibleFrom: unknown) {
  const item = findPosDiscount(catalogKey);
  if (!item) throw new Error('Unknown discount');
  if (typeof hidden !== 'boolean') throw new Error('Invalid visibility');
  const date = parseIsoDate(visibleFrom);

  const db = serviceDb();
  const { error } = await db.from('pos_discount_visibility').upsert({
    catalog_id: catalogKey,
    hidden,
    visible_from: date,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  return { catalogId: catalogKey, hidden, visibleFrom: date };
}

/** Last money-voucher claim → cooldown end ISO, or null if clear. */
async function getMoneyCooldownUntil(userId: string): Promise<string | null> {
  const db = serviceDb();
  const { data: claims } = await db
    .from('user_offer_claims')
    .select('claimed_at, offer_id')
    .eq('user_id', userId)
    .order('claimed_at', { ascending: false });
  if (!claims?.length) return null;

  const offerIds = [...new Set(claims.map((c) => c.offer_id).filter(Boolean))];
  if (!offerIds.length) return null;

  const { data: moneyOffers } = await db
    .from('reward_offers')
    .select('id')
    .in('id', offerIds)
    .eq('offer_kind', 'money');
  const moneyIds = new Set((moneyOffers ?? []).map((o) => o.id));

  const lastMoney = claims.find((c) => moneyIds.has(c.offer_id));
  if (!lastMoney?.claimed_at) return null;

  const claimedAt = new Date(String(lastMoney.claimed_at)).getTime();
  if (!Number.isFinite(claimedAt)) return null;
  const until = claimedAt + MONEY_COOLDOWN_MS;
  if (until <= Date.now()) return null;
  return new Date(until).toISOString();
}

/** Expire past-due vouchers, then return whether user still has an unused one. */
async function hasUnusedActiveVoucher(userId: string): Promise<boolean> {
  const db = serviceDb();
  const nowIso = new Date().toISOString();

  await db
    .from('vouchers')
    .update({ state: 'expired' })
    .eq('user_id', userId)
    .in('state', ['active', 'pending'])
    .lt('expires_at', nowIso);

  const { data } = await db
    .from('vouchers')
    .select('id')
    .eq('user_id', userId)
    .in('state', ['active', 'pending'])
    .limit(1);

  return (data?.length ?? 0) > 0;
}

async function listCatalog(userId: string, kind: OfferKind) {
  const db = serviceDb();
  const { data: offers, error } = await db
    .from('reward_offers')
    .select('id, title, description, euro_value, points_cost, offer_kind, starts_at, ends_at, restaurant_id, created_at')
    .eq('is_active', true)
    .eq('offer_kind', kind)
    .order('points_cost', { ascending: true });
  if (error) throw new Error(error.message);

  const moneyCooldownUntil = kind === 'money' ? await getMoneyCooldownUntil(userId) : null;
  const hasActiveVoucher = await hasUnusedActiveVoucher(userId);

  if (kind === 'promo') {
    return { catalog: [], moneyCooldownUntil, hasActiveVoucher };
  }

  const visibility = await listVisibility();
  const today = lisbonToday();
  const catalog = (offers ?? [])
    .filter((o) => {
      const euro = Number(o.euro_value ?? 0);
      const pts = Number(o.points_cost ?? 0);
      if (!isPosMoneyPrize(euro, pts)) return false;
      const match = POS_DISCOUNT_CATALOG.find(
        (discount) => discount.kind === 'money' && discount.euroValue === euro && discount.pointsCost === pts,
      );
      return match != null && isDiscountVisible(match, visibility.get(match.id), today);
    })
    .map((o) => ({
      id: String(o.id),
      title: String(o.title),
      description: String(o.description ?? ''),
      pointsCost: Number(o.points_cost),
      euroValue: Number(o.euro_value),
      offerKind: String(o.offer_kind ?? kind),
      imageUrl: '',
      restaurantName:
        o.restaurant_id === 'portugueseLab'
          ? 'Portuguese Lab'
          : o.restaurant_id === 'pizzaLab'
            ? 'Pizza Lab'
            : 'Chef Domingos',
      restaurantId: String(o.restaurant_id ?? ''),
      expiresAt: o.ends_at ? String(o.ends_at) : null,
      startsAt: o.starts_at ? String(o.starts_at) : null,
    }));

  return { catalog, moneyCooldownUntil, hasActiveVoucher };
}

async function adminList() {
  const db = serviceDb();
  const { data, error } = await db
    .from('reward_offers')
    .select(
      'id, title, description, euro_value, points_cost, is_active, offer_kind, starts_at, ends_at, restaurant_id, menu_item_key, promo_benefit, item_price, created_at',
    )
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function deactivateOffer(offerId: string) {
  const db = serviceDb();
  const { error } = await db
    .from('reward_offers')
    .update({ is_active: false })
    .eq('id', offerId);
  if (error) throw new Error(error.message);
  return { deactivated: true };
}

async function claimOffer(_userId: string, offerId: string) {
  const db = serviceDb();

  const { data: offer, error: offerErr } = await db
    .from('reward_offers')
    .select('id, euro_value, points_cost, is_active, offer_kind')
    .eq('id', offerId)
    .single();
  if (offerErr || !offer || !offer.is_active) throw new Error('Offer not found or inactive');

  const claimEuro = Number(offer.euro_value ?? 0);
  const claimPts = Number(offer.points_cost ?? 0);
  if (String(offer.offer_kind ?? 'money') === 'money' && isPosMoneyPrize(claimEuro, claimPts)) {
    throw new Error('POS_PRIZE');
  }

  throw new Error('TILL_ONLY');
}

async function listMyLocalVouchers(userId: string) {
  const db = serviceDb();
  const { data, error } = await db
    .from('vouchers')
    .select(
      'id, title, state, restaurant_name, points_cost, euro_value, expires_at, active_from, qr_value, lkm_voucher_id, staff_instruction',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const now = Date.now();
  const expiredIds: string[] = [];

  const vouchers = (data ?? []).map((v) => {
    let state = (['active', 'used', 'expired', 'pending'].includes(String(v.state))
      ? v.state
      : 'active') as 'active' | 'used' | 'expired' | 'pending';

    if (state !== 'used' && state !== 'expired' && v.expires_at) {
      const exp = new Date(String(v.expires_at)).getTime();
      if (Number.isFinite(exp) && exp <= now) {
        state = 'expired';
        expiredIds.push(String(v.id));
      }
    }

    return {
      id: String(v.lkm_voucher_id ?? v.id),
      title: String(v.title),
      state,
      restaurantName: String(v.restaurant_name ?? 'Chef Domingos'),
      pointsCost: Number(v.points_cost ?? 0),
      euroValue: Number(v.euro_value ?? 0),
      staffInstruction: v.staff_instruction ? String(v.staff_instruction) : undefined,
      expiresAt: v.expires_at ? String(v.expires_at) : null,
      activeFrom: v.active_from ? String(v.active_from) : null,
      qrValue: String(v.qr_value ?? v.lkm_voucher_id ?? v.id),
    };
  });

  if (expiredIds.length) {
    await db.from('vouchers').update({ state: 'expired' }).in('id', expiredIds);
  }

  return vouchers;
}

async function findLocalVoucher(code: string) {
  const db = serviceDb();
  const candidates = [...new Set([code, code.toUpperCase(), code.toLowerCase()].filter(Boolean))];
  for (const candidate of candidates) {
    if (!/^[A-Z0-9-]+$/i.test(candidate)) continue;
    const { data, error } = await db
      .from('vouchers')
      .select(
        'id, title, state, euro_value, expires_at, active_from, qr_value, lkm_voucher_id, staff_instruction',
      )
      .or(`qr_value.eq.${candidate},lkm_voucher_id.eq.${candidate}`)
      .limit(1)
      .maybeSingle();
    if (error) console.warn('[reward-offers] findLocalVoucher', candidate, error.message);
    if (data) return data;
  }
  return null;
}

async function validateLocal(codVoucher: string) {
  const db = serviceDb();
  const code = extractVoucherCode(codVoucher);
  if (!code) {
    return { status: 'not_active' as const, title: '', euroValue: 0, staffInstruction: '', found: false };
  }

  const voucher = await findLocalVoucher(code);
  console.log('[reward-offers] validateLocal', { code, found: Boolean(voucher) });

  if (!voucher) {
    return { status: 'not_active' as const, title: '', euroValue: 0, staffInstruction: '', found: false };
  }

  const now = new Date();
  const expiry = voucher.expires_at ? new Date(String(voucher.expires_at)) : null;
  const activeAt = voucher.active_from ? new Date(String(voucher.active_from)) : null;
  const title = String(voucher.title ?? '');
  const euroValue = Number(voucher.euro_value ?? 0);
  const staffInstruction = String(voucher.staff_instruction ?? '');

  if (voucher.state === 'used') {
    return { status: 'already_used' as const, title, euroValue, staffInstruction, found: true };
  }
  if (expiry && now > expiry) {
    await db.from('vouchers').update({ state: 'expired' }).eq('id', voucher.id);
    return { status: 'expired' as const, title, euroValue, staffInstruction, found: true };
  }
  if (activeAt && now < activeAt) {
    return { status: 'not_active' as const, title, euroValue, staffInstruction, found: true };
  }

  await db
    .from('vouchers')
    .update({ state: 'used', used_at: now.toISOString() })
    .eq('id', voucher.id);

  return { status: 'valid' as const, title, euroValue, staffInstruction, found: true };
}

async function unvalidateLocal(codVoucher: string) {
  const db = serviceDb();
  const code = extractVoucherCode(codVoucher);
  if (!code) {
    return { status: 'not_active' as const, title: '', euroValue: 0, staffInstruction: '', found: false };
  }

  const voucher = await findLocalVoucher(code);
  if (!voucher) {
    return { status: 'not_active' as const, title: '', euroValue: 0, staffInstruction: '', found: false };
  }

  const now = new Date();
  const expiry = voucher.expires_at ? new Date(String(voucher.expires_at)) : null;
  const activeAt = voucher.active_from ? new Date(String(voucher.active_from)) : null;
  const title = String(voucher.title ?? '');
  const euroValue = Number(voucher.euro_value ?? 0);
  const staffInstruction = String(voucher.staff_instruction ?? '');

  if (expiry && now > expiry) {
    await db.from('vouchers').update({ state: 'expired' }).eq('id', voucher.id);
    return { status: 'expired' as const, title, euroValue, staffInstruction, found: true };
  }

  if (voucher.state === 'used') {
    const nextState = activeAt && now < activeAt ? 'pending' : 'active';
    const { error } = await db
      .from('vouchers')
      .update({ state: nextState, used_at: null })
      .eq('id', voucher.id);
    if (error) throw new Error(error.message);
    return { status: 'restored' as const, title, euroValue, staffInstruction, found: true };
  }

  if (voucher.state === 'active' || voucher.state === 'pending') {
    return { status: 'restored' as const, title, euroValue, staffInstruction, found: true };
  }

  return { status: 'expired' as const, title, euroValue, staffInstruction, found: true };
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { user } = await getSupabaseUser(req);

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const action = url.searchParams.get('action') ?? 'catalog';
      const kindParam = url.searchParams.get('kind');
      const kind: OfferKind = kindParam === 'promo' ? 'promo' : 'money';

      if (action === 'catalog') {
        const { catalog, moneyCooldownUntil, hasActiveVoucher } = await listCatalog(user.id, kind);
        return jsonResponse({ catalog, moneyCooldownUntil, hasActiveVoucher }, { headers: corsHeaders });
      }
      if (action === 'list') {
        const vouchers = await listMyLocalVouchers(user.id);
        return jsonResponse({ vouchers }, { headers: corsHeaders });
      }
      if (action === 'admin-list') {
        if (!(await isUserAdmin(user.id, user.email))) return errorResponse('Admin access required', 403);
        const offers = await adminList();
        return jsonResponse({ offers }, { headers: corsHeaders });
      }
      if (action === 'visibility') {
        const visibility = await listVisibility();
        return jsonResponse({
          visibility: [...visibility.entries()].map(([catalogId, row]) => ({
            catalogId,
            hidden: row.hidden,
            visibleFrom: row.visibleFrom,
          })),
        }, { headers: corsHeaders });
      }
      return errorResponse('Unknown action');
    }

    if (req.method === 'POST') {
      const body = await req.json() as Record<string, unknown>;
      const action = String(body.action ?? '');

      if (
        action === 'create' ||
        action === 'activateCatalog' ||
        action === 'setVisibility' ||
        action === 'deactivate' ||
        action === 'validateLocal' ||
        action === 'unvalidateLocal'
      ) {
        if (!(await isUserAdmin(user.id, user.email))) return errorResponse('Admin access required', 403);
      }

      if (action === 'create' || action === 'activateCatalog') {
        return errorResponse('Discounts come from the till catalog. Hide one or set the day it becomes visible.', 400);
      }

      if (action === 'setVisibility') {
        const saved = await setVisibility(String(body.catalogKey ?? ''), body.hidden, body.visibleFrom);
        return jsonResponse({ visibility: saved }, { headers: corsHeaders });
      }

      if (action === 'deactivate') {
        const result = await deactivateOffer(String(body.offerId));
        return jsonResponse(result, { headers: corsHeaders });
      }

      if (action === 'claim') {
        const voucher = await claimOffer(user.id, String(body.offerId));
        return jsonResponse({ voucher }, { headers: corsHeaders });
      }

      if (action === 'validateLocal') {
        const result = await validateLocal(String(body.codVoucher ?? ''));
        return jsonResponse(result, { headers: corsHeaders });
      }

      if (action === 'unvalidateLocal') {
        const result = await unvalidateLocal(String(body.codVoucher ?? ''));
        return jsonResponse(result, { headers: corsHeaders });
      }

      return errorResponse('Unknown action');
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    console.error('[reward-offers]', err);
    return errorResponse((err as Error).message, 400);
  }
});
