-- Loyalty Integration Schema
-- Adds LKM card linkage, transaction cache, vouchers, and promotions

-- ── 1. Extend users table ─────────────────────────────────────────────────────

alter table users
  add column if not exists lkm_card_code    text,
  add column if not exists lkm_access_token text,
  add column if not exists short_code       text;

comment on column users.lkm_card_code    is 'LKM loyalty card identifier returned at registration';
comment on column users.lkm_access_token is 'LKM access token used to obtain ClientJwtToken';
comment on column users.short_code       is 'Human-readable fallback code shown in Ganhar screen (e.g. A3B2-C4D5-E6F7)';

-- ── 2. Restaurants reference table ───────────────────────────────────────────

create table if not exists restaurants (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  lkm_store_id  text not null,
  description   text,
  logo_url      text,
  image_url     text,
  created_at    timestamp default now()
);

comment on column restaurants.lkm_store_id is 'CodLoja value used in LKM API calls for this restaurant';

insert into restaurants (name, lkm_store_id, description) values
  ('Portuguese Lab', 'PT_LAB_01', 'Comida típica portuguesa'),
  ('Pizza Lab',      'PZ_LAB_01', 'Pizzaria artesanal'),
  ('Arrozeria',      'ARZ_01',    'Especialidades de arroz')
on conflict do nothing;

-- ── 3. Loyalty transactions cache ─────────────────────────────────────────────

create table if not exists loyalty_transactions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references users(id) on delete cascade,
  lkm_tx_id      text unique,
  restaurant_name text,
  restaurant_id   uuid references restaurants(id),
  points_delta    integer not null,
  description     text,
  tx_date         timestamp not null,
  type            text not null check (type in ('earn', 'redeem')),
  synced_at       timestamp default now()
);

create index if not exists idx_loyalty_tx_user_id on loyalty_transactions(user_id);
create index if not exists idx_loyalty_tx_date    on loyalty_transactions(tx_date desc);

alter table loyalty_transactions enable row level security;

create policy "Users can view own transactions"
  on loyalty_transactions for select
  using (auth.uid() = user_id);

create policy "Edge functions can insert transactions"
  on loyalty_transactions for insert
  with check (auth.uid() = user_id);

-- ── 4. Vouchers ───────────────────────────────────────────────────────────────

create table if not exists vouchers (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references users(id) on delete cascade,
  lkm_voucher_id  text unique,
  title           text not null,
  description     text,
  points_cost     integer not null default 0,
  restaurant_id   uuid references restaurants(id),
  restaurant_name text,
  state           text not null default 'active'
                    check (state in ('pending', 'active', 'used', 'expired')),
  active_from     timestamp,
  expires_at      timestamp,
  qr_value        text,
  created_at      timestamp default now(),
  used_at         timestamp
);

create index if not exists idx_vouchers_user_id on vouchers(user_id);
create index if not exists idx_vouchers_state   on vouchers(state);

alter table vouchers enable row level security;

create policy "Users can view own vouchers"
  on vouchers for select
  using (auth.uid() = user_id);

create policy "Edge functions can insert vouchers"
  on vouchers for insert
  with check (auth.uid() = user_id);

create policy "Edge functions can update vouchers"
  on vouchers for update
  using (auth.uid() = user_id);

-- ── 5. Promotions (PANS cross-restaurant campaigns) ───────────────────────────

create table if not exists promotions (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  description     text,
  tag             text,
  points_cost     integer not null default 0,
  restaurant_id   uuid references restaurants(id),
  restaurant_name text,
  image_url       text,
  active_from     timestamp not null default now(),
  expires_at      timestamp,
  is_active       boolean not null default true,
  lkm_catalog_id  text,
  created_at      timestamp default now()
);

create index if not exists idx_promotions_active on promotions(is_active, active_from, expires_at);

alter table promotions enable row level security;

create policy "Promotions are publicly readable"
  on promotions for select
  using (true);

-- ── 6. App token cache (server-side, service role only) ───────────────────────

create table if not exists lkm_token_cache (
  key         text primary key,
  token       text not null,
  expires_at  timestamp not null,
  updated_at  timestamp default now()
);

comment on table lkm_token_cache is 'Server-side cache for LKM AppJwtToken. Written by Edge Functions with service role key only.';

-- ── 7. Update settings seed ───────────────────────────────────────────────────

insert into settings (key, value) values
  ('lkm_enabled', 'true'),
  ('points_milestone_1', '300'),
  ('points_milestone_2', '600'),
  ('points_milestone_3', '900')
on conflict (key) do nothing;
