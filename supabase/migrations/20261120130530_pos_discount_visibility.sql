-- Per-discount visibility for the fixed Mytarget prize list.
-- Customers never write this table. The reward-offers function uses the service role.

create table if not exists pos_discount_visibility (
  catalog_id text primary key,
  hidden boolean not null default false,
  visible_from date,
  updated_at timestamptz not null default now()
);

comment on table pos_discount_visibility is
  'Admin hide flag and optional first day a till discount is shown to customers.';

alter table pos_discount_visibility enable row level security;
