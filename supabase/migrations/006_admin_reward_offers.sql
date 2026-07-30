-- Admin-managed money voucher offers + per-user claims

alter table users
  add column if not exists is_admin boolean not null default false;

comment on column users.is_admin is 'Store/admin users who can manage reward offers in the app';

create table if not exists reward_offers (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  description  text,
  euro_value   numeric(10,2) not null check (euro_value > 0),
  points_cost  integer not null check (points_cost > 0),
  is_active    boolean not null default true,
  created_by   uuid references users(id) on delete set null,
  created_at   timestamp default now()
);

create index if not exists idx_reward_offers_active on reward_offers(is_active, points_cost);

alter table reward_offers enable row level security;

create policy "Authenticated users can read active offers"
  on reward_offers for select
  using (auth.role() = 'authenticated' and is_active = true);

create table if not exists user_offer_claims (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  offer_id    uuid not null references reward_offers(id) on delete cascade,
  voucher_id  uuid references vouchers(id) on delete set null,
  points_cost integer not null,
  claimed_at  timestamp default now(),
  unique (user_id, offer_id)
);

create index if not exists idx_user_offer_claims_user on user_offer_claims(user_id);

alter table user_offer_claims enable row level security;

create policy "Users can read own claims"
  on user_offer_claims for select
  using (auth.uid() = user_id);

-- Default money vouchers (progress bar uses the first 3)
insert into reward_offers (title, description, euro_value, points_cost, is_active)
select * from (values
  ('Vale 5€',  'Troque 500 pontos por um vale de 5€',  5::numeric,  500,  true),
  ('Vale 10€', 'Troque 900 pontos por um vale de 10€', 10::numeric, 900,  true),
  ('Vale 20€', 'Troque 1700 pontos por um vale de 20€', 20::numeric, 1700, true)
) as v(title, description, euro_value, points_cost, is_active)
where not exists (select 1 from reward_offers limit 1);

-- Align settings milestones with 3 progress-bar tiers
update settings set value = '500'  where key = 'points_milestone_1';
update settings set value = '900'  where key = 'points_milestone_2';
update settings set value = '1700' where key = 'points_milestone_3';
delete from settings where key = 'points_milestone_4';
