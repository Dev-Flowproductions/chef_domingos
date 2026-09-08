import { POINTS_PER_EURO } from './loyaltyRules';
import { RESTAURANT_MENUS, type RestaurantId } from './menuI18n';

/** Numeric menu prices (€) — source of truth for promo math (1€ = 10 pts). */
export const MENU_ITEM_PRICES: Record<RestaurantId, Record<string, number>> = {
  portugueseLab: {
    menuFrango: 12.5,
    menuCarne: 13.5,
    menuBras: 13.5,
    saladaVerao: 12.5,
    risottoRiaFormosa: 12.5,
    risottoNegro: 12.5,
    arrozTamboril: 12.9,
    hamburgerChoco: 12.9,
    fileteRobalo: 14.5,
    bacalhauLagareiro: 17.5,
    lomboSalmao: 15.5,
    polvoLagareiro: 18.9,
    tirasChoco: 12.9,
    bifeNovilhoGrelhado: 13.5,
    bitoqueChef: 13.5,
    hamburgerChef: 12.5,
    pianinhoPorcoIberico: 13.9,
    risottoCogumelos: 12.5,
    hamburgerFeijao: 12.5,
    sopaDoDia: 2.5,
    pao: 0.7,
    saladaMista: 2.2,
    arroz: 2,
    batataFrita: 2.5,
    batataDoce: 3,
    feijaoPreto: 3,
    ovo: 1.2,
    bacon: 1.5,
    boloLevedo: 0.8,
    boloLevedoManteiga: 1,
    extraMolhoCogumelos: 0.5,
    extraMolhoManga: 0.5,
    extraMaioneseAlho: 0.5,
    extraMolhoPimenta: 0.5,
    extraSaladaCouve: 0.5,
    extraMolhoBitoque: 0.5,
    extraManteigaAlho: 0.5,
    legumesSalteados: 2.5,
    sacoTakeAway: 0.5,
    caixaTakeAway: 0.3,
    extraCarneHamburger: 6,
    extraFrango: 6,
    extraLula: 3,
    extraMioloCamarao: 3,
    extraCamarao: 1.2,
    extraSecretos: 6.5,
    extraCarneMedalhao: 6,
    extraAnanas: 1.2,
    arrozDoce: 3,
    deliciaCafe: 3.5,
    mousseChocolate: 3.5,
    babaCamelo: 3.5,
    banofee: 3.5,
    copoFruta: 2.5,
    macaAssada: 2.5,
    sobremesaChef: 3.5,
    sobremesaSimples: 2.5,
    gelatina: 2,
    imperial025: 1.7,
    caneca50: 2.7,
    shandy: 1.7,
    canecaShandy: 2.7,
    cervejaGastronomica: 2,
    cervejaSemAlcool: 1.8,
    copoVinhoTinto: 2.2,
    copoVinhoBranco: 2.2,
    copoVinhoRose: 2.2,
    garrafaVinhoTinto: 8,
    garrafaVinhoBranco: 8,
    garrafaVinhoRose: 8,
    meiaGarrafaVinhoTinto: 5,
    meiaGarrafaVinhoBranco: 5,
    pepsi30: 1.7,
    pepsiMax30: 1.7,
    sevenUp30: 1.7,
    icetea30: 1.7,
    sumolLaranja30: 1.7,
    agua033: 1.5,
    aguaComGas: 1.6,
    aguaSabores: 1.7,
    somersby020: 1.7,
    sumoNaturalLaranja: 2.5,
    sumoDoDia: 2.5,
    extraCanecaMenu: 1.3,
    extraCanecaShandyMenu: 1.3,
    extraSumoDoDiaMenu: 1.4,
    extraSumoLaranjaMenu: 1.4,
    extraGarrafaVinhoTintoPeqMenu: 3.9,
    extraGarrafaVinhoBrancoPeqMenu: 3.9,
    jarroSangriaTinto: 10.5,
    jarroSangriaBranca: 10.5,
    cafe: 1,
    descafeinado: 1,
  },
  pizzaLab: {
    diavola: 10.9,
    peperoni: 11.9,
    margaritta: 9.9,
    tropical: 12.9,
    pizzaLab: 12.9,
    rustica: 12.5,
    quatroQueijos: 12.5,
    camponesa: 11.9,
    funghi: 11.5,
    primavera: 11.9,
    atlantica: 12.5,
    sevilhana: 11.9,
    carbonara: 11.9,
    maresia: 13.5,
    algarvia: 12.9,
    margaritaPremium: 11.9,
    paoAlhoSimples: 4.9,
    paoAlhoQueijo: 5.5,
    paoAlhoQueijoPeperoni: 6.5,
    pizzaDoceAvela: 4.9,
    pizzaDoceAvelaFruta: 5.5,
    pizzaDoceChocolateAmendoas: 5.5,
    sopaDoDia: 2.5,
    batatasFritasAlho: 2.5,
    saladaMista: 2.5,
    asinhasFrangoBbq: 7,
    camaraoAlho: 9.9,
    queijoVegan: 2,
    massaSemGluten: 3,
  },
};

export type PromoBenefit = 'free' | 'off20';

export interface MenuItemRef {
  restaurantId: RestaurantId;
  categoryId: string;
  itemKey: string;
  priceEuros: number;
}

function collectMenuItems(
  restaurantId: RestaurantId,
  categoryFilter?: (categoryId: string) => boolean,
): MenuItemRef[] {
  const menu = RESTAURANT_MENUS[restaurantId];
  const prices = MENU_ITEM_PRICES[restaurantId];
  const out: MenuItemRef[] = [];
  for (const categoryId of menu.categories) {
    if (categoryFilter && !categoryFilter(categoryId)) continue;
    for (const itemKey of menu.items[categoryId] ?? []) {
      const priceEuros = prices[itemKey];
      if (priceEuros == null) continue;
      out.push({ restaurantId, categoryId, itemKey, priceEuros });
    }
  }
  return out;
}

/** Full client menu (includes complements). */
export function listMenuItems(restaurantId: RestaurantId): MenuItemRef[] {
  return collectMenuItems(restaurantId);
}

/** Admin promo picker — excludes complement extras. */
export function listAdminMenuItems(restaurantId: RestaurantId): MenuItemRef[] {
  const excluded = new Set(RESTAURANT_MENUS[restaurantId].adminExcludedCategories ?? []);
  return collectMenuItems(restaurantId, (categoryId) => !excluded.has(categoryId));
}

/** Discount applied on till + points to redeem (1€ = 10 pts). */
export function computePromoValues(itemPriceEuros: number, benefit: PromoBenefit) {
  const euroValue =
    benefit === 'free'
      ? roundMoney(itemPriceEuros)
      : roundMoney(itemPriceEuros * 0.2);
  const pointsCost = Math.max(1, Math.round(euroValue * POINTS_PER_EURO));
  return { euroValue, pointsCost };
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildPromoTitle(
  itemName: string,
  benefit: PromoBenefit,
  locale: 'pt' | 'en' = 'pt',
): string {
  if (benefit === 'free') {
    return locale === 'pt' ? `${itemName} grátis` : `Free ${itemName}`;
  }
  return locale === 'pt' ? `20% em ${itemName}` : `20% off ${itemName}`;
}

export function buildPromoDescription(
  itemName: string,
  restaurantName: string,
  benefit: PromoBenefit,
  _euroValue: number,
  pointsCost: number,
  locale: 'pt' | 'en' = 'pt',
): string {
  if (locale === 'pt') {
    return benefit === 'free'
      ? `1× ${itemName} grátis em ${restaurantName}. Resgate: ${pointsCost} pts.`
      : `20% em 1× ${itemName} (${restaurantName}). Resgate: ${pointsCost} pts.`;
  }
  return benefit === 'free'
    ? `1× free ${itemName} at ${restaurantName}. Redeem for ${pointsCost} pts.`
    : `20% off 1× ${itemName} at ${restaurantName}. Redeem for ${pointsCost} pts.`;
}

export function buildStaffInstruction(
  itemName: string,
  benefit: PromoBenefit,
  euroValue: number,
  locale: 'pt' | 'en' = 'pt',
): string {
  if (benefit === 'free') {
    return locale === 'pt'
      ? `Oferecer 1× ${itemName} (desconto ${euroValue.toFixed(2)}€)`
      : `Give 1× ${itemName} (€${euroValue.toFixed(2)} discount)`;
  }
  return locale === 'pt'
    ? `20% em 1× ${itemName} → aplicar ${euroValue.toFixed(2)}€`
    : `20% off 1× ${itemName} → apply €${euroValue.toFixed(2)}`;
}
