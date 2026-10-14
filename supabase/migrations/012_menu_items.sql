-- Editable restaurant menus (admin can add / edit price / remove within fixed categories)

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null,
  category_id text not null,
  item_key text not null,
  name_pt text not null,
  name_en text not null,
  description_pt text,
  description_en text,
  price_euros numeric(10, 2) not null check (price_euros >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, item_key)
);

create index if not exists menu_items_restaurant_category_idx
  on menu_items (restaurant_id, category_id, sort_order);

alter table menu_items enable row level security;

create policy "Authenticated users read active menu items"
  on menu_items for select to authenticated
  using (
    is_active = true
    or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  );

create policy "Admins insert menu items"
  on menu_items for insert to authenticated
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

create policy "Admins update menu items"
  on menu_items for update to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

create policy "Admins delete menu items"
  on menu_items for delete to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));
