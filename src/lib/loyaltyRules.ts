/**
 * Chef Domingos loyalty rules (confirmed with LKM).
 * Earn: 1€ = 10 points.
 * Redeem money vouchers: 500→5€, 900→10€, 1700→20€, 2500→30€.
 * Progress bar: 3 fixed money-voucher milestones.
 * Catalog offers: admin-created (defaults seeded in DB).
 */
export const POINTS_PER_EURO = 10;

/** After redeeming a money voucher, block another money redeem for this long. */
export const MONEY_VOUCHER_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/** Fixed progress-bar milestones (always 3). */
export const PROGRESS_VOUCHERS = [
  { pts: 500, euros: 5, id: 'v5' },
  { pts: 900, euros: 10, id: 'v10' },
  { pts: 1700, euros: 20, id: 'v20' },
] as const;

/** @deprecated use PROGRESS_VOUCHERS — kept for older imports */
export const MONEY_VOUCHERS = PROGRESS_VOUCHERS;

export const MAX_REWARD_PTS = PROGRESS_VOUCHERS[PROGRESS_VOUCHERS.length - 1].pts;

export type ProgressVoucher = (typeof PROGRESS_VOUCHERS)[number];

export function eurosFromPoints(points: number): number {
  return points / POINTS_PER_EURO;
}

export function milestoneLabelKey(pts: number): string {
  const match = PROGRESS_VOUCHERS.find((v) => v.pts === pts);
  if (match) return `rewards.tier${match.euros}`;
  const lower = [...PROGRESS_VOUCHERS].reverse().find((v) => pts >= v.pts);
  if (lower) return `rewards.tier${lower.euros}`;
  return `rewards.tier${PROGRESS_VOUCHERS[0].euros}`;
}

/** Resolve voucher state using the device clock (ISO expiresAt / activeFrom). */
export function resolveVoucherState(
  voucher: {
    state: 'active' | 'used' | 'expired' | 'pending';
    expiresAt?: string | null;
    activeFrom?: string | null;
  },
  nowMs: number = Date.now(),
): 'active' | 'used' | 'expired' | 'pending' {
  if (voucher.state === 'used') return 'used';
  if (voucher.state === 'expired') return 'expired';
  if (voucher.expiresAt) {
    const exp = new Date(voucher.expiresAt).getTime();
    if (Number.isFinite(exp) && exp <= nowMs) return 'expired';
  }
  if (voucher.activeFrom) {
    const from = new Date(voucher.activeFrom).getTime();
    if (Number.isFinite(from) && from > nowMs) return 'pending';
  }
  if (voucher.state === 'pending') return 'pending';
  return 'active';
}

export function formatVoucherExpiry(expiresAt: string, locale: string): string {
  const d = new Date(expiresAt);
  if (!Number.isFinite(d.getTime())) return expiresAt.slice(0, 10);
  return d.toLocaleString(locale.startsWith('pt') ? 'pt-PT' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function moneyCooldownRemainingMs(cooldownUntil: string | null | undefined, nowMs = Date.now()): number {
  if (!cooldownUntil) return 0;
  const until = new Date(cooldownUntil).getTime();
  if (!Number.isFinite(until)) return 0;
  return Math.max(0, until - nowMs);
}
