-- Staff can reverse points when a POS sale is cancelled.
-- Debited from app balance the same way as voucher claims (LKM has no cancel-tx API).

create table if not exists points_reversals (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  points      integer not null check (points > 0),
  lkm_tx_id   text,
  reason      text,
  created_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create unique index if not exists idx_points_reversals_user_tx
  on points_reversals (user_id, lkm_tx_id)
  where lkm_tx_id is not null;

create index if not exists idx_points_reversals_user_id
  on points_reversals (user_id);

alter table points_reversals enable row level security;

create policy "Users can view own points reversals"
  on points_reversals for select
  using (auth.uid() = user_id);

-- Staff writes go through service-role edge functions only.

alter table loyalty_transactions
  drop constraint if exists loyalty_transactions_type_check;

alter table loyalty_transactions
  add constraint loyalty_transactions_type_check
  check (type in ('earn', 'redeem', 'reversal'));
