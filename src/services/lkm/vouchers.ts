import { lkmCall } from './client';

export interface CatalogItem {
  id:             string;
  title:          string;
  description:    string;
  pointsCost:     number;
  imageUrl:       string;
  restaurantName: string;
  restaurantId:   string;
  expiresAt:      string | null;
}

export interface UserVoucher {
  id:             string;
  title:          string;
  state:          'active' | 'used' | 'expired' | 'pending';
  restaurantName: string;
  pointsCost:     number;
  expiresAt:      string | null;
  activeFrom:     string | null;
  qrValue:        string;
}

export type VoucherValidationStatus =
  | 'valid'
  | 'already_used'
  | 'expired'
  | 'not_active';

export interface VoucherValidationResult {
  status: VoucherValidationStatus;
  title:  string;
}

export async function getRewardCatalog(): Promise<CatalogItem[]> {
  const res = await lkmCall<{ catalog: CatalogItem[] }>('lkm-vouchers', {
    query: { action: 'catalog' },
  });
  return res.catalog;
}

export async function getMyVouchers(): Promise<UserVoucher[]> {
  const res = await lkmCall<{ vouchers: UserVoucher[] }>('lkm-vouchers', {
    query: { action: 'list' },
  });
  return res.vouchers;
}

export async function claimVoucher(codCatalog: string): Promise<UserVoucher> {
  const res = await lkmCall<{ voucher: UserVoucher }>('lkm-vouchers', {
    method: 'POST',
    body: { action: 'claim', codCatalog },
  });
  return res.voucher;
}

export async function validateVoucher(
  codVoucher: string,
  codLoja?: string,
): Promise<VoucherValidationResult> {
  return lkmCall<VoucherValidationResult>('lkm-vouchers', {
    method: 'POST',
    body: { action: 'validate', codVoucher, codLoja },
  });
}

export async function activateVoucher(codVale: string): Promise<{ activated: boolean }> {
  return lkmCall('lkm-vouchers', {
    method: 'POST',
    body: { action: 'activate', codVale },
  });
}

export async function registerEarnScan(
  transactionId: string,
  storeId?: string,
): Promise<{ success: boolean; pointsEarned: number; newBalance: number; message: string }> {
  return lkmCall('lkm-scan', {
    method: 'POST',
    body: { transactionId, storeId },
  });
}
