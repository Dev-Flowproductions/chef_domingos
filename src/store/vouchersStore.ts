import { create } from 'zustand';
import type { CatalogItem, UserVoucher } from '../services/lkm/vouchers';
import {
  getAdminRewardCatalog,
  getMyLocalVouchers,
  claimAdminOffer,
} from '../services/lkm/rewardOffers';
import { resolveVoucherState } from '../lib/loyaltyRules';

interface VouchersState {
  moneyCatalog: CatalogItem[];
  promoCatalog: CatalogItem[];
  myVouchers: UserVoucher[];
  moneyCooldownUntil: string | null;
  hasActiveVoucher: boolean;
  catalogLoading: boolean;
  promoLoading: boolean;
  vouchersLoading: boolean;
  claiming: boolean;
  error: string | null;

  /** @deprecated use moneyCatalog */
  catalog: CatalogItem[];

  fetchCatalog: () => Promise<void>;
  fetchPromoCatalog: () => Promise<void>;
  fetchMyVouchers: () => Promise<void>;
  claim: (offerId: string) => Promise<UserVoucher>;
  reset: () => void;
}

function withDeviceExpiry(vouchers: UserVoucher[]): UserVoucher[] {
  const now = Date.now();
  return vouchers.map((v) => ({
    ...v,
    state: resolveVoucherState(v, now),
  }));
}

function computeHasActive(vouchers: UserVoucher[]): boolean {
  return vouchers.some((v) => {
    const state = resolveVoucherState(v);
    return state === 'active' || state === 'pending';
  });
}

export const useVouchersStore = create<VouchersState>((set) => ({
  moneyCatalog: [],
  promoCatalog: [],
  catalog: [],
  myVouchers: [],
  moneyCooldownUntil: null,
  hasActiveVoucher: false,
  catalogLoading: false,
  promoLoading: false,
  vouchersLoading: false,
  claiming: false,
  error: null,

  fetchCatalog: async () => {
    set({ catalogLoading: true, error: null });
    try {
      const { catalog: moneyCatalog, moneyCooldownUntil, hasActiveVoucher } =
        await getAdminRewardCatalog('money');
      set({
        moneyCatalog,
        catalog: moneyCatalog,
        moneyCooldownUntil,
        hasActiveVoucher,
        catalogLoading: false,
      });
    } catch (err) {
      set({
        catalogLoading: false,
        error: (err as Error).message,
        moneyCatalog: [],
        catalog: [],
        moneyCooldownUntil: null,
      });
    }
  },

  fetchPromoCatalog: async () => {
    set({ promoLoading: true, error: null });
    try {
      const { catalog: promoCatalog, hasActiveVoucher } = await getAdminRewardCatalog('promo');
      set({ promoCatalog, hasActiveVoucher, promoLoading: false });
    } catch (err) {
      set({ promoLoading: false, error: (err as Error).message, promoCatalog: [] });
    }
  },

  fetchMyVouchers: async () => {
    set({ vouchersLoading: true, error: null });
    try {
      const raw = await getMyLocalVouchers();
      const myVouchers = withDeviceExpiry(raw);
      set({
        myVouchers,
        hasActiveVoucher: computeHasActive(myVouchers),
        vouchersLoading: false,
      });
    } catch (err) {
      set({ vouchersLoading: false, error: (err as Error).message });
    }
  },

  claim: async (offerId: string) => {
    set({ claiming: true, error: null });
    try {
      const wasMoney = useVouchersStore.getState().moneyCatalog.some((c) => c.id === offerId);
      const voucher = await claimAdminOffer(offerId);
      const resolved = withDeviceExpiry([voucher])[0];
      set((s) => {
        const myVouchers = [resolved, ...s.myVouchers];
        return {
          claiming: false,
          myVouchers,
          hasActiveVoucher: true,
          moneyCatalog: s.moneyCatalog.filter((c) => c.id !== offerId),
          promoCatalog: s.promoCatalog.filter((c) => c.id !== offerId),
          catalog: s.catalog.filter((c) => c.id !== offerId),
          moneyCooldownUntil: wasMoney
            ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            : s.moneyCooldownUntil,
        };
      });
      return resolved;
    } catch (err) {
      set({ claiming: false, error: (err as Error).message });
      throw err;
    }
  },

  reset: () =>
    set({
      moneyCatalog: [],
      promoCatalog: [],
      catalog: [],
      myVouchers: [],
      moneyCooldownUntil: null,
      hasActiveVoucher: false,
      catalogLoading: false,
      promoLoading: false,
      vouchersLoading: false,
      claiming: false,
      error: null,
    }),
}));
