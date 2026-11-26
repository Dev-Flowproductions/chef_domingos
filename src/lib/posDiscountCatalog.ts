/**
 * Discounts the till can redeem (WinRest “Resgatar vales e brindes” + Ganhar QR).
 * Keep in sync with POS_DISCOUNT_CATALOG in supabase/functions/reward-offers/index.ts.
 * Codes and points are copied from LKM GET /v2/Prizes/ListAll.
 * Percentage is on the whole bill. A percentage on one dish is not a till prize.
 */
export type PosDiscountKind = 'money' | 'percent' | 'article';

export type PosDiscount = {
  id: string;
  kind: PosDiscountKind;
  pointsCost: number | null;
  euroValue: number | null;
  percent: number | null;
  lkmCode: number | null;
  reference: string | null;
  /** Prize already exists in Mytarget, so the cashier can select it. */
  tillReady: boolean;
};

export const POS_DISCOUNT_CATALOG: readonly PosDiscount[] = [
  { id: 'money-5', kind: 'money', pointsCost: 500, euroValue: 5, percent: null, lkmCode: 210, reference: '01', tillReady: true },
  { id: 'money-10', kind: 'money', pointsCost: 900, euroValue: 10, percent: null, lkmCode: 211, reference: '02', tillReady: true },
  { id: 'money-20', kind: 'money', pointsCost: 1700, euroValue: 20, percent: null, lkmCode: 212, reference: '03', tillReady: true },
  { id: 'money-30', kind: 'money', pointsCost: 2500, euroValue: 30, percent: null, lkmCode: 213, reference: '04', tillReady: true },
  { id: 'percent-10', kind: 'percent', pointsCost: 400, euroValue: null, percent: 10, lkmCode: 215, reference: '05', tillReady: true },
  { id: 'percent-20', kind: 'percent', pointsCost: 700, euroValue: null, percent: 20, lkmCode: 216, reference: '06', tillReady: true },
  { id: 'percent-30', kind: 'percent', pointsCost: 1000, euroValue: null, percent: 30, lkmCode: 217, reference: '07', tillReady: true },
  { id: 'special-romantic', kind: 'article', pointsCost: 600, euroValue: null, percent: null, lkmCode: 218, reference: '08', tillReady: true },
  { id: 'special-friends', kind: 'article', pointsCost: 650, euroValue: null, percent: null, lkmCode: 220, reference: '10', tillReady: true },
];

export const POS_DISCOUNT_KINDS: readonly PosDiscountKind[] = ['money', 'percent', 'article'];

export function discountsOfKind(kind: PosDiscountKind): PosDiscount[] {
  return POS_DISCOUNT_CATALOG.filter((discount) => discount.kind === kind);
}

export function findPosDiscount(id: string): PosDiscount | undefined {
  return POS_DISCOUNT_CATALOG.find((discount) => discount.id === id);
}

export type PosDiscountVisibility = {
  hidden: boolean;
  /** Kept for stored rows. Visibility is only the hidden switch. */
  visibleFrom: string | null;
};

/** Euro vouchers stay visible until an admin hides them. The other prizes start hidden. */
export function defaultDiscountHidden(kind: PosDiscountKind): boolean {
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

export function lisbonDateISO(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Lisbon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function isDiscountVisibleToCustomers(
  discount: Pick<PosDiscount, 'kind'>,
  visibility: PosDiscountVisibility | undefined,
  _todayISO?: string,
): boolean {
  const hidden = visibility?.hidden ?? defaultDiscountHidden(discount.kind);
  return !hidden;
}

export function offerMatchesPosDiscount(
  offer: { offer_kind?: string | null; euro_value?: number | null; points_cost?: number | null },
  discount: PosDiscount,
): boolean {
  if (discount.kind !== 'money' || discount.euroValue == null || discount.pointsCost == null) return false;
  if ((offer.offer_kind ?? 'money') === 'promo') return false;
  return Number(offer.euro_value) === discount.euroValue && Number(offer.points_cost) === discount.pointsCost;
}
