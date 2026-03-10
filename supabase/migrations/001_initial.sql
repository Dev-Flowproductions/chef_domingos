-- Pizza Lab — Initial Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users profile table (mirrors Supabase auth.users)
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique,
  name text,
  phone text,
  created_at timestamp default now()
);

-- Pizzas menu
create table if not exists pizzas (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric(10, 2) not null,
  image_url text,
  category text,
  winrest_id text,
  created_at timestamp default now()
);

-- Customer orders
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','confirmed','preparing','ready','completed','cancelled')),
  total_price numeric(10, 2) not null,
  pos_id text,
  pos_status text,
  created_at timestamp default now()
);

-- Line items per order
create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  pizza_id uuid references pizzas(id),
  quantity integer not null check (quantity > 0),
  price numeric(10, 2) not null
);

-- Feature flags table
create table if not exists settings (
  key text primary key,
  value text not null,
  updated_at timestamp default now()
);

-- Seed feature flags
insert into settings (key, value) values
  ('winrest_enabled', 'false')
on conflict (key) do nothing;

-- Row Level Security
alter table users enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table pizzas enable row level security;

-- Policies: users can only read/update their own profile
create policy "Users can view own profile"
  on users for select using (auth.uid() = id);

create policy "Users can update own profile"
  on users for update using (auth.uid() = id);

-- Policies: pizzas are public
create policy "Pizzas are publicly readable"
  on pizzas for select using (true);

-- Policies: users can view/create own orders
create policy "Users can view own orders"
  on orders for select using (auth.uid() = user_id);

create policy "Users can create orders"
  on orders for insert with check (auth.uid() = user_id);

-- Policies: users can view own order items
create policy "Users can view own order items"
  on order_items for select
  using (
    exists (
      select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid()
    )
  );

create policy "Users can create order items"
  on order_items for insert
  with check (
    exists (
      select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid()
    )
  );
