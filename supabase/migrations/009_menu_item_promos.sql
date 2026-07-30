-- Specific menu-item promos (free / 50% on a named dish)

alter table reward_offers
  add column if not exists restaurant_id text,
  add column if not exists menu_item_key text,
  add column if not exists promo_benefit text,
  add column if not exists item_price numeric(10,2);

do $$ begin
  alter table reward_offers add constraint reward_offers_promo_benefit_check
    check (promo_benefit is null or promo_benefit in ('free', 'half'));
exception when duplicate_object then null;
end $$;

alter table vouchers
  add column if not exists staff_instruction text,
  add column if not exists menu_item_key text,
  add column if not exists promo_benefit text;
