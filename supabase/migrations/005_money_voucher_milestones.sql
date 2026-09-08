-- Update loyalty milestones to money vouchers
-- Earn: 1€ = 10 points
-- Redeem: 500→5€, 900→10€, 1700→20€, 2500→30€

update settings set value = '500'  where key = 'points_milestone_1';
update settings set value = '900'  where key = 'points_milestone_2';
update settings set value = '1700' where key = 'points_milestone_3';

insert into settings (key, value) values
  ('points_milestone_4', '2500'),
  ('points_per_euro', '10')
on conflict (key) do update set value = excluded.value;
