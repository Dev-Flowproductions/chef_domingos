import { lkmCall } from './client';

export interface StaffEarnTransaction {
  id: string;
  restaurant: string;
  date: string | null;
  amountPaid: number;
  points: number;
  alreadyReversed: boolean;
}

export interface StaffLookupResult {
  cardCode: string;
  email: string | null;
  name: string | null;
  balance: number;
  transactions: StaffEarnTransaction[];
}

export interface StaffReverseResult {
  success: boolean;
  pointsRemoved: number;
  newBalance: number;
}

export async function lookupCustomerByCard(cardCode: string): Promise<StaffLookupResult> {
  return lkmCall<StaffLookupResult>('staff-points', {
    query: { action: 'lookup', cardCode: cardCode.trim() },
  });
}

export async function reverseCustomerPoints(opts: {
  cardCode: string;
  points?: number;
  lkmTxId?: string;
  reason?: string;
}): Promise<StaffReverseResult> {
  return lkmCall<StaffReverseResult>('staff-points', {
    method: 'POST',
    body: {
      action: 'reverse',
      cardCode: opts.cardCode.trim(),
      points: opts.points,
      lkmTxId: opts.lkmTxId,
      reason: opts.reason,
    },
  });
}
