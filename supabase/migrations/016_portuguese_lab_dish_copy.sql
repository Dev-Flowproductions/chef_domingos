-- Official Portuguese Lab dish copy (fundo branco) plus the summer salad price.

update menu_items set
  description_pt = 'Perfumado com açafrão, camarão, ameijoas e filete de robalo.',
  description_en = 'Scented with saffron, with shrimp, clams and sea bass fillet.',
  updated_at = now()
where restaurant_id = 'portugueseLab' and item_key = 'risottoRiaFormosa';

update menu_items set
  description_pt = 'Camarão e lulas, com flor de sal e ervas frescas.',
  description_en = 'Shrimp and squid, with fleur de sel and fresh herbs.',
  updated_at = now()
where restaurant_id = 'portugueseLab' and item_key = 'risottoNegro';

update menu_items set
  description_pt = 'Com manteiga de alho, batatas e legumes aromatizados.',
  description_en = 'With garlic butter, aromatic potatoes and vegetables.',
  updated_at = now()
where restaurant_id = 'portugueseLab' and item_key = 'bifeNovilhoGrelhado';

update menu_items set
  description_pt = 'Com camarão e salmão, em bolo lêvedo, salada de couve e batatas aromatizadas.',
  description_en = 'With shrimp and salmon, on yeast cake, cabbage salad and aromatic potatoes.',
  updated_at = now()
where restaurant_id = 'portugueseLab' and item_key = 'hamburgerChoco';

update menu_items set
  description_pt = 'Com molho de barbecue e amêndoas torradas.',
  description_en = 'With barbecue sauce and toasted almonds.',
  updated_at = now()
where restaurant_id = 'portugueseLab' and item_key = 'pianinhoPorcoIberico';

update menu_items set
  description_pt = 'Com camarão e ervas frescas.',
  description_en = 'With shrimp and fresh herbs.',
  updated_at = now()
where restaurant_id = 'portugueseLab' and item_key = 'arrozTamboril';

update menu_items set
  description_pt = 'Com legumes salteados, batata doce e azeite aromatizado com coentros.',
  description_en = 'With sautéed vegetables, sweet potato and coriander olive oil.',
  updated_at = now()
where restaurant_id = 'portugueseLab' and item_key = 'lomboSalmao';

update menu_items set
  description_pt = 'Panadas, servidas com arroz, batata aromatizada, salada e maionese com pickles.',
  description_en = 'Breaded, served with rice, aromatic potatoes, salad and pickled mayonnaise.',
  updated_at = now()
where restaurant_id = 'portugueseLab' and item_key = 'tirasChoco';

update menu_items set
  description_pt = 'Bife de novilho grelhado, bacon, ovo, batata, arroz, salada e molho à portuguesa.',
  description_en = 'Grilled beef steak, bacon, egg, potatoes, rice, salad and Portuguese sauce.',
  updated_at = now()
where restaurant_id = 'portugueseLab' and item_key = 'bitoqueChef';

update menu_items set
  description_pt = 'Carne de novilho, bolo lêvedo, bacon, ovo estrelado, batata aromatizada e salada, com molho de cogumelos ou pimenta.',
  description_en = 'Beef, yeast cake, bacon, fried egg, aromatic potatoes and salad, with mushroom or pepper sauce.',
  updated_at = now()
where restaurant_id = 'portugueseLab' and item_key = 'hamburgerChef';

update menu_items set
  description_pt = 'Com espargos.',
  description_en = 'With asparagus.',
  updated_at = now()
where restaurant_id = 'portugueseLab' and item_key = 'risottoCogumelos';

update menu_items set
  description_pt = 'Com soja, nozes e cogumelos em bolo lêvedo, cebolada de pimentos, batata doce e mistura de alfaces.',
  description_en = 'With soy, nuts and mushrooms on yeast cake, onion and pepper sauce, sweet potato and mixed lettuce.',
  updated_at = now()
where restaurant_id = 'portugueseLab' and item_key = 'hamburgerFeijao';

update menu_items set
  price_euros = 11.90,
  updated_at = now()
where restaurant_id = 'portugueseLab' and item_key = 'saladaVerao';

insert into menu_items (
  restaurant_id, category_id, item_key, name_pt, name_en, description_pt, description_en, price_euros, sort_order, is_active
) values
  ('portugueseLab', 'peixe', 'bacalhauBras', 'Bacalhau à Brás', 'Codfish à Brás', 'Com salada fresca e vinagrete de ervas.', 'With fresh salad and herb vinaigrette.', 12.50, 13, true),
  ('portugueseLab', 'peixe', 'arrozPolvo', 'Arroz de polvo à algarvia', 'Algarvian octopus rice', 'Com ervas aromáticas e cebola frita.', 'With aromatic herbs and crispy onion.', 12.50, 14, true),
  ('portugueseLab', 'peixe', 'bacalhauNatas', 'Bacalhau com natas', 'Codfish with cream', 'Servido com camarão grelhado e salada mista.', 'Served with grilled shrimp and a mixed salad.', 12.50, 15, true),
  ('portugueseLab', 'carne', 'medalhoesNovilho', 'Medalhões de novilho', 'Beef medallions', 'Com molho de cogumelos ou pimenta, arroz e batata aromatizada.', 'With mushroom or pepper sauce, rice and aromatic potatoes.', 12.90, 17, true),
  ('portugueseLab', 'carne', 'escalopesFrango', 'Escalopes de frango', 'Chicken escalopes', 'Com molho de cogumelos ou pimenta, arroz, batata aromatizada e cebola frita.', 'With mushroom or pepper sauce, rice, aromatic potatoes and crispy onion.', 11.90, 18, true),
  ('portugueseLab', 'carne', 'bifinhoFrango', 'Bifinho de frango grelhado', 'Grilled chicken steak', 'Com ananás, batata aromatizada e legumes salteados.', 'With pineapple, aromatic potatoes and sautéed vegetables.', 11.90, 19, true),
  ('portugueseLab', 'carne', 'bifeTuga', 'Bife à tuga', 'Portuguese-style steak', 'Servido com camarão grelhado, ovo, batata aromática e arroz.', 'Served with grilled shrimp, fried egg, aromatic potato and rice.', 16.90, 20, true),
  ('portugueseLab', 'carne', 'maminhaNovilho', 'Maminha de novilho grelhada', 'Grilled sirloin', 'Servida com feijão preto, arroz, batata aromática e ananás.', 'Served with black beans, rice, seasoned potatoes and pineapple.', 12.90, 21, true),
  ('portugueseLab', 'carne', 'arrozPato', 'Arroz de pato à portuguesa', 'Portuguese-style duck rice', 'Com mistura de alfaces e enchidos.', 'With mixed salad and sausages.', 12.50, 22, true),
  ('portugueseLab', 'carne', 'secretosPorco', 'Secretos de porco alentejano', 'Alentejo pork secretos', 'Grelhados em baixa temperatura, com batata aromatizada, salada, ananás, pickles e molho de alho.', 'Slow-grilled, with aromatic potatoes, salad, pineapple, pickles and garlic sauce.', 12.90, 23, true),
  ('portugueseLab', 'vegetariano', 'risottoEspinafres', 'Risoto de espinafres', 'Spinach risotto', 'Com gengibre e amêndoas torradas.', 'With ginger and toasted almonds.', 11.90, 19, true)
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
