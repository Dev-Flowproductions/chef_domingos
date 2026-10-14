import { lkmCall } from './client';
import type { CatalogItem, UserVoucher, VoucherValidationResult } from './vouchers';

export type { CatalogItem, UserVoucher };

export type OfferKind = 'money' | 'promo';
export type PromoBenefit = 'free' | 'off20';

export interface AdminOffer {
  id: string;
  title: string;
  description: string | null;
  euro_value: number;
  points_cost: number;
  is_active: boolean;
  offer_kind?: OfferKind;
  starts_at?: string | null;
  ends_at?: string | null;
  restaurant_id?: string | null;
  menu_item_key?: string | null;
  promo_benefit?: PromoBenefit | null;
  item_price?: number | null;
  created_at: string;
}

export async function getAdminRewardCatalog(kind: OfferKind = 'money'): Promise<{
  catalog: CatalogItem[];
  moneyCooldownUntil: string | null;
  hasActiveVoucher: boolean;
}> {
  const res = await lkmCall<{
    catalog: CatalogItem[];
    moneyCooldownUntil?: string | null;
    hasActiveVoucher?: boolean;
  }>('reward-offers', {
    query: { action: 'catalog', kind },
  });
  return {
    catalog: res.catalog,
    moneyCooldownUntil: res.moneyCooldownUntil ?? null,
    hasActiveVoucher: Boolean(res.hasActiveVoucher),
  };
}

export async function getMyLocalVouchers(): Promise<UserVoucher[]> {
  const res = await lkmCall<{ vouchers: UserVoucher[] }>('reward-offers', {
    query: { action: 'list' },
  });
  return res.vouchers;
}

export async function claimAdminOffer(offerId: string): Promise<UserVoucher> {
  const res = await lkmCall<{ voucher: UserVoucher }>('reward-offers', {
    method: 'POST',
    body: { action: 'claim', offerId },
  });
  return res.voucher;
}

export async function listAdminOffers(): Promise<AdminOffer[]> {
  const res = await lkmCall<{ offers: AdminOffer[] }>('reward-offers', {
    query: { action: 'admin-list' },
  });
  return res.offers;
}

export async function createAdminOffer(params: {
  euroValue: number;
  pointsCost: number;
  title?: string;
  description?: string;
  offerKind?: OfferKind;
  startsAt?: string | null;
  endsAt?: string | null;
  restaurantId?: string | null;
  menuItemKey?: string | null;
  promoBenefit?: PromoBenefit | null;
  itemPrice?: number | null;
  staffInstruction?: string | null;
}): Promise<AdminOffer> {
  const res = await lkmCall<{ offer: AdminOffer }>('reward-offers', {
    method: 'POST',
    body: {
      action: 'create',
      euroValue: params.euroValue,
      pointsCost: params.pointsCost,
      title: params.title,
      description: params.description,
      offerKind: params.offerKind ?? 'money',
      startsAt: params.startsAt,
      endsAt: params.endsAt,
      restaurantId: params.restaurantId,
      menuItemKey: params.menuItemKey,
      promoBenefit: params.promoBenefit,
      itemPrice: params.itemPrice,
      staffInstruction: params.staffInstruction,
    },
  });
  return res.offer;
}

export async function deactivateAdminOffer(offerId: string): Promise<void> {
  await lkmCall('reward-offers', {
    method: 'POST',
    body: { action: 'deactivate', offerId },
  });
}

export async function validateLocalVoucher(
  codVoucher: string,
): Promise<
  VoucherValidationResult & {
    found?: boolean;
    euroValue?: number;
    staffInstruction?: string;
  }
> {
  return lkmCall('reward-offers', {
    method: 'POST',
    body: { action: 'validateLocal', codVoucher },
  });
}
