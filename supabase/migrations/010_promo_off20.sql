-- Switch percent promos from 50% (half) to 20% (off20)

alter table reward_offers drop constraint if exists reward_offers_promo_benefit_check;

update reward_offers
set promo_benefit = 'off20'
where promo_benefit = 'half';

alter table reward_offers add constraint reward_offers_promo_benefit_check
  check (promo_benefit is null or promo_benefit in ('free', 'off20', 'half'));
