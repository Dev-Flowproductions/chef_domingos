import { create } from 'zustand';
import {
  CatalogItem,
  UserVoucher,
  getRewardCatalog,
  getMyVouchers,
  claimVoucher,
} from '../services/lkm/vouchers';

interface VouchersState {
  catalog:         CatalogItem[];
  myVouchers:      UserVoucher[];
  catalogLoading:  boolean;
  vouchersLoading: boolean;
  claiming:        boolean;
  error:           string | null;

  fetchCatalog:    () => Promise<void>;
  fetchMyVouchers: () => Promise<void>;
  claim:           (codCatalog: string) => Promise<UserVoucher>;
  reset:           () => void;
}

export const useVouchersStore = create<VouchersState>((set, get) => ({
  catalog:         [],
  myVouchers:      [],
  catalogLoading:  false,
  vouchersLoading: false,
  claiming:        false,
  error:           null,

  fetchCatalog: async () => {
    set({ catalogLoading: true, error: null });
    try {
      const catalog = await getRewardCatalog();
      set({ catalog, catalogLoading: false });
    } catch (err) {
      set({ catalogLoading: false, error: (err as Error).message });
    }
  },

  fetchMyVouchers: async () => {
    set({ vouchersLoading: true, error: null });
    try {
      const myVouchers = await getMyVouchers();
      set({ myVouchers, vouchersLoading: false });
    } catch (err) {
      set({ vouchersLoading: false, error: (err as Error).message });
    }
  },

  claim: async (codCatalog: string) => {
    set({ claiming: true, error: null });
    try {
      const voucher = await claimVoucher(codCatalog);
      set((s) => ({
        claiming:   false,
        myVouchers: [voucher, ...s.myVouchers],
      }));
      return voucher;
    } catch (err) {
      set({ claiming: false, error: (err as Error).message });
      throw err;
    }
  },

  reset: () =>
    set({
      catalog:         [],
      myVouchers:      [],
      catalogLoading:  false,
      vouchersLoading: false,
      claiming:        false,
      error:           null,
    }),
}));
