// reward-offers Edge Function
// GET  ?action=catalog&kind=money|promo  → offers not claimed by user (time-window aware for promo)
// GET  ?action=list                      → user's vouchers
// GET  ?action=admin-list
// POST create / claim / deactivate / validateLocal

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import {
  getSupabaseUser,
  serviceDb,
  jsonResponse,
  errorResponse,
  getLkmCard,
  getClientToken,
  lkmFetch,
} from '../_shared/lkm-client.ts';

type OfferKind = 'money' | 'promo';

const MONEY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `VD-${seg()}-${seg()}`;
}

async function isUserAdmin(userId: string): Promise<boolean> {
  const db = serviceDb();
  const { data, error } = await db.from('users').select('is_admin').eq('id', userId).maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data?.is_admin);
}

async function getLkmBalance(userId: string): Promise<number> {
  try {
    const { accessToken } = await getLkmCard(userId);
    const clientToken = await getClientToken(accessToken);
    const balanceRaw = await lkmFetch<number>('/v2/Points', { clientToken });
    return Number(balanceRaw ?? 0);
  } catch {
    return 0;
  }
}

async function getClaimedPoints(userId: string): Promise<number> {
  const db = serviceDb();
  const { data } = await db
    .from('user_offer_claims')
    .select('points_cost')
    .eq('user_id', userId);
  return (data ?? []).reduce((sum, row) => sum + Number(row.points_cost ?? 0), 0);
}

function isWithinWindow(startsAt: string | null, endsAt: string | null, nowMs = Date.now()): boolean {
  if (startsAt && new Date(startsAt).getTime() > nowMs) return false;
  if (endsAt && new Date(endsAt).getTime() < nowMs) return false;
  return true;
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
    .select('id, title, description, euro_value, points_cost, offer_kind, starts_at, ends_at, created_at')
    .eq('is_active', true)
    .eq('offer_kind', kind)
    .order('points_cost', { ascending: true });
  if (error) throw new Error(error.message);

  const { data: claims } = await db
    .from('user_offer_claims')
    .select('offer_id')
    .eq('user_id', userId);
  const claimed = new Set((claims ?? []).map((c) => c.offer_id));

  const moneyCooldownUntil = kind === 'money' ? await getMoneyCooldownUntil(userId) : null;
  const hasActiveVoucher = await hasUnusedActiveVoucher(userId);

  const catalog = (offers ?? [])
    .filter((o) => !claimed.has(o.id))
    .filter((o) => kind === 'money' || isWithinWindow(o.starts_at, o.ends_at))
    .map((o) => ({
      id: String(o.id),
      title: String(o.title),
      description: String(o.description ?? ''),
      pointsCost: Number(o.points_cost),
      euroValue: Number(o.euro_value),
      offerKind: String(o.offer_kind ?? kind),
      imageUrl: '',
      restaurantName: 'Chef Domingos',
      restaurantId: '',
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

async function createOffer(
  userId: string,
  body: {
    title?: string;
    description?: string;
    euroValue: number;
    pointsCost: number;
    offerKind?: string;
    startsAt?: string | null;
    endsAt?: string | null;
    restaurantId?: string | null;
    menuItemKey?: string | null;
    promoBenefit?: string | null;
    itemPrice?: number | null;
    staffInstruction?: string | null;
  },
) {
  const offerKind: OfferKind = body.offerKind === 'promo' ? 'promo' : 'money';
  const euroValue = Number(body.euroValue);
  const pointsCost = Number(body.pointsCost);
  if (!(pointsCost > 0)) throw new Error('pointsCost must be positive');
  if (!(euroValue > 0)) {
    throw new Error('Set a fixed euro discount to apply on the POS');
  }

  const promoBenefit =
    body.promoBenefit === 'free' || body.promoBenefit === 'off20' || body.promoBenefit === 'half'
      ? body.promoBenefit === 'half'
        ? 'off20'
        : body.promoBenefit
      : null;

  if (offerKind === 'promo') {
    if (!body.menuItemKey?.trim() || !body.restaurantId?.trim() || !promoBenefit) {
      throw new Error('Promo offers must pick a menu item and free or 20% off');
    }
    if (!body.title?.trim()) {
      throw new Error('Promo offers need a title');
    }
  }

  const title =
    body.title?.trim() ||
    (offerKind === 'money' ? `Vale ${euroValue}€` : 'Oferta');
  const description =
    body.description?.trim() ||
    (offerKind === 'money'
      ? `Troque ${pointsCost} pontos por um vale de ${euroValue}€. Os pontos são debitados no resgate.`
      : `Troque ${pointsCost} pontos por esta oferta.`);

  const db = serviceDb();
  const { data, error } = await db
    .from('reward_offers')
    .insert({
      title,
      description,
      euro_value: euroValue,
      points_cost: pointsCost,
      is_active: true,
      created_by: userId,
      offer_kind: offerKind,
      starts_at: body.startsAt || null,
      ends_at: body.endsAt || null,
      restaurant_id: body.restaurantId || null,
      menu_item_key: body.menuItemKey || null,
      promo_benefit: promoBenefit,
      item_price: body.itemPrice != null ? Number(body.itemPrice) : null,
    })
    .select(
      'id, title, description, euro_value, points_cost, is_active, offer_kind, starts_at, ends_at, restaurant_id, menu_item_key, promo_benefit, item_price, created_at',
    )
    .single();
  if (error) throw new Error(error.message);

  // Keep staff instruction on a side channel via description; vouchers get it at claim
  return { ...data, staff_instruction: body.staffInstruction ?? description };
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

async function claimOffer(userId: string, offerId: string) {
  const db = serviceDb();

  const { data: offer, error: offerErr } = await db
    .from('reward_offers')
    .select(
      'id, title, description, euro_value, points_cost, is_active, offer_kind, starts_at, ends_at, restaurant_id, menu_item_key, promo_benefit, item_price',
    )
    .eq('id', offerId)
    .single();
  if (offerErr || !offer || !offer.is_active) throw new Error('Offer not found or inactive');

  if (offer.offer_kind === 'promo' && !isWithinWindow(offer.starts_at, offer.ends_at)) {
    throw new Error('This offer is not available right now');
  }

  const { data: existing } = await db
    .from('user_offer_claims')
    .select('id')
    .eq('user_id', userId)
    .eq('offer_id', offerId)
    .maybeSingle();
  if (existing) throw new Error('You already redeemed this voucher');

  if (await hasUnusedActiveVoucher(userId)) {
    throw new Error('ACTIVE_VOUCHER');
  }

  if (String(offer.offer_kind ?? 'money') === 'money') {
    const cooldownUntil = await getMoneyCooldownUntil(userId);
    if (cooldownUntil) {
      throw new Error(`COOLDOWN:${cooldownUntil}`);
    }
  }

  const lkmBalance = await getLkmBalance(userId);
  const spent = await getClaimedPoints(userId);
  const available = lkmBalance - spent;
  if (available < Number(offer.points_cost)) {
    throw new Error(
      `Pontos insuficientes. Disponível: ${available}, necessário: ${offer.points_cost}`,
    );
  }

  const code = generateVoucherCode();
  const expires = offer.ends_at
    ? new Date(String(offer.ends_at))
    : (() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 6);
        return d;
      })();

  const euroValue = Number(offer.euro_value ?? 0);
  const benefit = String(offer.promo_benefit ?? '');
  const staffInstruction =
    benefit === 'free'
      ? `Oferecer 1× ${offer.title.replace(/\s*grátis$/i, '').trim()} (desconto ${euroValue.toFixed(2)}€)`
      : benefit === 'off20' || benefit === 'half'
      ? `${offer.title} → aplicar ${euroValue.toFixed(2)}€ no POS`
      : `Aplicar ${euroValue.toFixed(2)}€ no POS`;

  const { data: voucher, error: vErr } = await db
    .from('vouchers')
    .insert({
      user_id: userId,
      lkm_voucher_id: code,
      title: offer.title,
      description: offer.description ?? '',
      points_cost: offer.points_cost,
      euro_value: euroValue,
      restaurant_name: offer.restaurant_id === 'portugueseLab' ? 'Portuguese Lab' : 'Pizza Lab',
      state: 'active',
      active_from: new Date().toISOString(),
      expires_at: expires.toISOString(),
      qr_value: code,
      staff_instruction: staffInstruction,
      menu_item_key: offer.menu_item_key,
      promo_benefit: offer.promo_benefit,
    })
    .select(
      'id, title, state, restaurant_name, points_cost, euro_value, expires_at, active_from, qr_value, lkm_voucher_id, staff_instruction',
    )
    .single();
  if (vErr || !voucher) throw new Error(vErr?.message ?? 'Failed to create voucher');

  const { error: cErr } = await db.from('user_offer_claims').insert({
    user_id: userId,
    offer_id: offerId,
    voucher_id: voucher.id,
    points_cost: offer.points_cost,
  });
  if (cErr) throw new Error(cErr.message);

  return {
    id: String(voucher.lkm_voucher_id ?? voucher.id),
    title: String(voucher.title),
    state: 'active' as const,
    restaurantName: String(voucher.restaurant_name ?? 'Chef Domingos'),
    pointsCost: Number(voucher.points_cost),
    euroValue: Number(voucher.euro_value ?? euroValue),
    staffInstruction: String(voucher.staff_instruction ?? staffInstruction),
    expiresAt: voucher.expires_at ? String(voucher.expires_at) : null,
    activeFrom: voucher.active_from ? String(voucher.active_from) : null,
    qrValue: String(voucher.qr_value ?? voucher.lkm_voucher_id ?? voucher.id),
  };
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

async function validateLocal(codVoucher: string) {
  const db = serviceDb();
  const code = codVoucher.trim();
  if (!code) {
    return { status: 'not_active' as const, title: '', euroValue: 0, staffInstruction: '', found: false };
  }

  let { data: voucher } = await db
    .from('vouchers')
    .select(
      'id, title, state, euro_value, expires_at, active_from, qr_value, lkm_voucher_id, staff_instruction',
    )
    .eq('qr_value', code)
    .maybeSingle();

  if (!voucher) {
    const second = await db
      .from('vouchers')
      .select(
        'id, title, state, euro_value, expires_at, active_from, qr_value, lkm_voucher_id, staff_instruction',
      )
      .eq('lkm_voucher_id', code)
      .maybeSingle();
    voucher = second.data;
  }

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
        if (!(await isUserAdmin(user.id))) return errorResponse('Admin access required', 403);
        const offers = await adminList();
        return jsonResponse({ offers }, { headers: corsHeaders });
      }
      return errorResponse('Unknown action');
    }

    if (req.method === 'POST') {
      const body = await req.json() as Record<string, unknown>;
      const action = String(body.action ?? '');

      if (action === 'create' || action === 'deactivate' || action === 'validateLocal') {
        if (!(await isUserAdmin(user.id))) return errorResponse('Admin access required', 403);
      }

      if (action === 'create') {
        const offer = await createOffer(user.id, {
          title: body.title != null ? String(body.title) : undefined,
          description: body.description != null ? String(body.description) : undefined,
          euroValue: Number(body.euroValue ?? 0),
          pointsCost: Number(body.pointsCost),
          offerKind: body.offerKind != null ? String(body.offerKind) : 'money',
          startsAt: body.startsAt != null ? String(body.startsAt) : null,
          endsAt: body.endsAt != null ? String(body.endsAt) : null,
          restaurantId: body.restaurantId != null ? String(body.restaurantId) : null,
          menuItemKey: body.menuItemKey != null ? String(body.menuItemKey) : null,
          promoBenefit: body.promoBenefit != null ? String(body.promoBenefit) : null,
          itemPrice: body.itemPrice != null ? Number(body.itemPrice) : null,
          staffInstruction: body.staffInstruction != null ? String(body.staffInstruction) : null,
        });
        return jsonResponse({ offer }, { headers: corsHeaders });
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

      return errorResponse('Unknown action');
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    console.error('[reward-offers]', err);
    return errorResponse((err as Error).message, 400);
  }
});
