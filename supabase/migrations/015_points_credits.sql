-- Manual point credits (e.g. goodwill loads) counted in app balance
-- alongside LKM, claims and reversals.

create table if not exists points_credits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  points integer not null check (points > 0),
  reason text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_points_credits_user_id on points_credits (user_id);

alter table points_credits enable row level security;

drop policy if exists "Users can view own points credits" on points_credits;
create policy "Users can view own points credits"
  on points_credits for select
  using (auth.uid() = user_id);

alter table loyalty_transactions
  drop constraint if exists loyalty_transactions_type_check;

alter table loyalty_transactions
  add constraint loyalty_transactions_type_check
  check (type in ('earn', 'redeem', 'reversal', 'credit'));
