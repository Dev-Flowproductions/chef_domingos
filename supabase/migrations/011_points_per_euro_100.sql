-- Loyalty earn/promo rate: 1€ = 100 points
-- Keep the three default money vouchers at their original costs:
--   500→5€, 900→10€, 1700→20€

update settings set value = '500'  where key = 'points_milestone_1';
update settings set value = '900'  where key = 'points_milestone_2';
update settings set value = '1700' where key = 'points_milestone_3';
update settings set value = '2500' where key = 'points_milestone_4';

insert into settings (key, value) values
  ('points_per_euro', '100')
on conflict (key) do update set value = excluded.value;

-- Restore default money voucher point costs (do not scale these three)
update reward_offers
set points_cost = 500
where offer_kind = 'money' and euro_value = 5 and is_active = true;

update reward_offers
set points_cost = 900
where offer_kind = 'money' and euro_value = 10 and is_active = true;

update reward_offers
set points_cost = 1700
where offer_kind = 'money' and euro_value = 20 and is_active = true;

-- Promo offers still use 100 pts/€
update reward_offers
set points_cost = greatest(1, round(euro_value * 100)::int)
where offer_kind = 'promo' and is_active = true;
