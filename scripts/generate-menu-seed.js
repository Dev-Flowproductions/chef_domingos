/**
 * Generate seed SQL for menu_items from local catalog + i18n.
 * Run: node scripts/generate-menu-seed.js > /tmp/seed.sql
 */
const fs = require('fs');
const path = require('path');

// Minimal parse of menuI18n categories/items by eval-like extraction is fragile;
// instead duplicate structure from requiring compiled content via reading JSON + menuI18n text.

const pt = JSON.parse(fs.readFileSync(path.join('src/i18n/locales/pt.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join('src/i18n/locales/en.json'), 'utf8'));
const catalogSrc = fs.readFileSync(path.join('src/lib/menuCatalog.ts'), 'utf8');
const menuI18nSrc = fs.readFileSync(path.join('src/lib/menuI18n.ts'), 'utf8');

function extractRestaurantBlock(src, restaurantId) {
  const marker = `${restaurantId}: {`;
  const start = src.indexOf(marker);
  if (start < 0) throw new Error('missing ' + restaurantId);
  // find matching closing for this object at brace depth
  let i = start + marker.length - 1;
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error('unclosed ' + restaurantId);
}

function parsePrices(block) {
  const prices = {};
  for (const m of block.matchAll(/([a-zA-Z][a-zA-Z0-9]*)\s*:\s*([0-9]+(?:\.[0-9]+)?)/g)) {
    prices[m[1]] = Number(m[2]);
  }
  return prices;
}

function parseItems(block) {
  const items = {};
  const itemsStart = block.indexOf('items: {');
  if (itemsStart < 0) return items;
  let i = itemsStart + 'items: {'.length - 1;
  let depth = 0;
  let end = i;
  for (; i < block.length; i++) {
    if (block[i] === '{') depth++;
    if (block[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const itemsBlock = block.slice(itemsStart, end + 1);
  for (const m of itemsBlock.matchAll(/([a-zA-Z][a-zA-Z0-9]*)\s*:\s*\[([^\]]*)\]/g)) {
    const keys = [...m[2].matchAll(/'([a-zA-Z0-9]+)'/g)].map((x) => x[1]);
    items[m[1]] = keys;
  }
  return items;
}

function esc(s) {
  if (s == null || s === '') return 'null';
  return "'" + String(s).replace(/'/g, "''") + "'";
}

const restaurants = ['portugueseLab', 'pizzaLab'];
const rows = [];

for (const restaurantId of restaurants) {
  const structureBlock = extractRestaurantBlock(menuI18nSrc, restaurantId);
  const priceBlock = extractRestaurantBlock(catalogSrc, restaurantId);
  const itemsByCat = parseItems(structureBlock);
  const prices = parsePrices(priceBlock);
  let sort = 0;
  for (const [categoryId, keys] of Object.entries(itemsByCat)) {
    for (const itemKey of keys) {
      const ptItem = pt.menu[restaurantId]?.items?.[itemKey];
      const enItem = en.menu[restaurantId]?.items?.[itemKey];
      if (!ptItem || !enItem) {
        console.error('Missing i18n for', restaurantId, itemKey);
        process.exit(1);
      }
      const price = prices[itemKey];
      if (price == null) {
        console.error('Missing price for', restaurantId, itemKey);
        process.exit(1);
      }
      rows.push({
        restaurantId,
        categoryId,
        itemKey,
        namePt: ptItem.name,
        nameEn: enItem.name,
        descPt: ptItem.description ?? null,
        descEn: enItem.description ?? null,
        price,
        sort: sort++,
      });
    }
  }
}

console.log('-- Seed menu_items from app catalog');
console.log('truncate menu_items;');
console.log('insert into menu_items (restaurant_id, category_id, item_key, name_pt, name_en, description_pt, description_en, price_euros, sort_order, is_active) values');
console.log(
  rows
    .map(
      (r) =>
        `(${esc(r.restaurantId)}, ${esc(r.categoryId)}, ${esc(r.itemKey)}, ${esc(r.namePt)}, ${esc(r.nameEn)}, ${esc(r.descPt)}, ${esc(r.descEn)}, ${r.price}, ${r.sort}, true)`,
    )
    .join(',\n') + ';',
);
console.error('rows', rows.length);
