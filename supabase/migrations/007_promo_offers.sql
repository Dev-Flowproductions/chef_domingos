-- Split home promos vs money vouchers; allow timed offers; euro_value may be 0 for % promos

alter table reward_offers drop constraint if exists reward_offers_euro_value_check;
alter table reward_offers add constraint reward_offers_euro_value_check check (euro_value >= 0);

alter table reward_offers
  add column if not exists offer_kind text not null default 'money',
  add column if not exists starts_at timestamp,
  add column if not exists ends_at timestamp;

do $$ begin
  alter table reward_offers add constraint reward_offers_kind_check
    check (offer_kind in ('money', 'promo'));
exception when duplicate_object then null;
end $$;

update reward_offers set offer_kind = 'money' where offer_kind is null or offer_kind = '';

-- Example home promos (admin can deactivate / create more)
insert into reward_offers (title, description, euro_value, points_cost, is_active, offer_kind, starts_at, ends_at)
select
  '50% na 2ª pizza',
  'Válido no Pizza Lab. Ao resgatar gasta 300 pontos. Mostre o QR no balcão.',
  0,
  300,
  true,
  'promo',
  now(),
  now() + interval '30 days'
where not exists (
  select 1 from reward_offers where title = '50% na 2ª pizza' and offer_kind = 'promo'
);

insert into reward_offers (title, description, euro_value, points_cost, is_active, offer_kind, starts_at, ends_at)
select
  'Sobremesa a metade do preço',
  'Válido em ambos os restaurantes. Ao resgatar gasta 200 pontos.',
  0,
  200,
  true,
  'promo',
  now(),
  now() + interval '30 days'
where not exists (
  select 1 from reward_offers where title = 'Sobremesa a metade do preço' and offer_kind = 'promo'
);
