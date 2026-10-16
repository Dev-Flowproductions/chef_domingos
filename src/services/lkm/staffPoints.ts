import { lkmCall } from './client';

export type StaffTxType = 'earn' | 'redeem' | 'credit' | 'reversal';

export interface StaffEarnTransaction {
  id: string;
  restaurant: string;
  date: string | null;
  amountPaid: number;
  points: number;
  alreadyReversed: boolean;
}

export interface StaffHistoryTransaction {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  cardCode: string | null;
  restaurant: string;
  description: string;
  date: string;
  points: number;
  type: StaffTxType;
  expiresAt: string | null;
  amountPaid: number;
  reversible: boolean;
  alreadyReversed: boolean;
}

export interface StaffUserRow {
  id: string;
  name: string | null;
  email: string | null;
  cardCode: string | null;
  shortCode: string | null;
  createdAt: string | null;
}

export interface StaffDirectoryResult {
  users: StaffUserRow[];
  transactions: StaffHistoryTransaction[];
}

export interface StaffLookupResult {
  userId: string;
  cardCode: string | null;
  email: string | null;
  name: string | null;
  balance: number;
  history: StaffHistoryTransaction[];
  transactions: StaffEarnTransaction[];
}

export interface StaffReverseResult {
  success: boolean;
  pointsRemoved: number;
  newBalance: number;
}

function normalizeLookup(raw: StaffLookupResult): StaffLookupResult {
  return {
    ...raw,
    userId: raw.userId,
    history: raw.history ?? [],
    transactions: raw.transactions ?? [],
  };
}

export async function listStaffDirectory(q = ''): Promise<StaffDirectoryResult> {
  const res = await lkmCall<StaffDirectoryResult>('staff-points', {
    query: { action: 'directory', q: q.trim() },
  });
  return {
    users: res.users ?? [],
    transactions: res.transactions ?? [],
  };
}

export async function getStaffUserHistory(userId: string): Promise<StaffLookupResult> {
  return normalizeLookup(
    await lkmCall<StaffLookupResult>('staff-points', {
      query: { action: 'history', userId },
    }),
  );
}

export async function lookupCustomerByCard(cardCode: string): Promise<StaffLookupResult> {
  return normalizeLookup(
    await lkmCall<StaffLookupResult>('staff-points', {
      query: { action: 'lookup', cardCode: cardCode.trim() },
    }),
  );
}

export async function reverseCustomerPoints(opts: {
  cardCode?: string | null;
  userId?: string;
  points?: number;
  lkmTxId?: string;
  reason?: string;
}): Promise<StaffReverseResult> {
  return lkmCall<StaffReverseResult>('staff-points', {
    method: 'POST',
    body: {
      action: 'reverse',
      cardCode: opts.cardCode?.trim() || undefined,
      userId: opts.userId,
      points: opts.points,
      lkmTxId: opts.lkmTxId,
      reason: opts.reason,
    },
  });
}
