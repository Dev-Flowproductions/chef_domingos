-- Pizza Lab drinks, copied from the Portuguese Lab list until Pizza Lab has its own.

insert into menu_items (
  restaurant_id, category_id, item_key, name_pt, name_en, description_pt, description_en, price_euros, sort_order, is_active
)
select
  'pizzaLab',
  'bebidas',
  item_key,
  name_pt,
  name_en,
  description_pt,
  description_en,
  price_euros,
  28 + row_number() over (order by sort_order),
  true
from menu_items
where restaurant_id = 'portugueseLab'
  and category_id = 'bebidas'
  and is_active = true
on conflict (restaurant_id, item_key) do update set
  category_id = excluded.category_id,
  name_pt = excluded.name_pt,
  name_en = excluded.name_en,
  description_pt = excluded.description_pt,
  description_en = excluded.description_en,
  price_euros = excluded.price_euros,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();
