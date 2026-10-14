-- Align app to LKM-corrected earn rate: 1€ = 10 points.
-- Money voucher thresholds stay fixed: 500/900/1700/2500 (not euro×rate).
-- Promo offers previously costed at 100 pts/€ — rescale to 10 pts/€.

insert into settings (key, value)
values ('points_per_euro', '10')
on conflict (key) do update set value = excluded.value, updated_at = now();

insert into settings (key, value)
values ('points_milestone_4', '2500')
on conflict (key) do update set value = excluded.value, updated_at = now();

-- Menu promos: recalculate from item_price / euro_value at 10 pts/€
update reward_offers
set points_cost = greatest(
  1,
  round(
    case
      when promo_benefit in ('off20', 'half') then coalesce(item_price, euro_value * 5) * 0.2
      else coalesce(item_price, euro_value)
    end * 10
  )::int
)
where offer_kind = 'promo'
  and is_active = true;

-- Ensure Vale 30€ exists at 2500 pts
insert into reward_offers (title, description, euro_value, points_cost, is_active, offer_kind)
select 'Vale 30€', 'Troque 2500 pontos por um vale de 30€', 30, 2500, true, 'money'
where not exists (
  select 1 from reward_offers
  where offer_kind = 'money' and points_cost = 2500 and euro_value = 30
);
