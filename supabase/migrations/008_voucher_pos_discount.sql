-- Store fixed POS discount on each issued voucher; require practical euro amounts on promos

alter table vouchers add column if not exists euro_value numeric(10,2) not null default 0;

update vouchers v
set euro_value = o.euro_value
from user_offer_claims c
join reward_offers o on o.id = c.offer_id
where c.voucher_id = v.id
  and coalesce(v.euro_value, 0) = 0
  and coalesce(o.euro_value, 0) > 0;

update reward_offers
set euro_value = 4.00,
    description = 'Aplique 4€ de desconto no POS (equivalente a ~metade de uma sobremesa típica). Mostre o QR no balcão.'
where offer_kind = 'promo'
  and title ilike '%sobremesa%'
  and euro_value = 0;

update reward_offers
set euro_value = 6.00,
    description = 'Aplique 6€ de desconto no POS na 2ª pizza. Mostre o QR no balcão.'
where offer_kind = 'promo'
  and title ilike '%pizza%'
  and euro_value = 0;
