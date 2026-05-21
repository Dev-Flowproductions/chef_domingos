import { lkmCall } from './client';

export type TxFilter = 'todos' | 'ganhos' | 'usados';

export interface AppTransaction {
  id:          string;
  restaurant:  string;
  description: string;
  date:        string;
  points:      number;
  type:        'earn' | 'redeem';
}

export interface TransactionsResponse {
  transactions: AppTransaction[];
  page:         number;
  perPage:      number;
  filter:       TxFilter;
}

export async function getTransactions(
  filter: TxFilter = 'todos',
  page = 1,
  perPage = 20,
): Promise<TransactionsResponse> {
  return lkmCall<TransactionsResponse>('lkm-transactions', {
    query: { filter, page, perPage },
  });
}
