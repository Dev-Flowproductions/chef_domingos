import type { TFunction } from 'i18next';
import type { CatalogItem } from '../services/lkm/vouchers';
import { PROGRESS_VOUCHERS, milestoneLabelKey } from './loyaltyRules';

export type OfferCardTheme = 'light' | 'dark';

/** Fallback only if the API catalog fails — mirrors default seeded offers. */
const FALLBACK_OFFER_KEYS: Record<
  string,
  {
    title: string;
    description: string;
    restaurantName: string;
    pointsCost: number;
    theme: OfferCardTheme;
  }
> = Object.fromEntries(
  PROGRESS_VOUCHERS.map((v, i) => [
    v.id,
    {
      title: `offers.${v.id}.title`,
      description: `offers.${v.id}.description`,
      restaurantName: `offers.${v.id}.tag`,
      pointsCost: v.pts,
      theme: (i % 2 === 0 ? 'dark' : 'light') as OfferCardTheme,
    },
  ]),
);

const FALLBACK_IMAGE_BY_ID: Record<string, number> = {
  v5: require('../assets/portuguese-lab-food.jpg'),
  v10: require('../assets/pizza-lab-food.jpg'),
  v20: require('../assets/portuguese-lab-food.jpg'),
};

export function getOfferCardTheme(item: CatalogItem): OfferCardTheme {
  const fallback = FALLBACK_OFFER_KEYS[item.id];
  if (fallback) return fallback.theme;
  const haystack = `${item.restaurantName} ${item.description} ${item.title}`.toLowerCase();
  if (haystack.includes('portuguese')) return 'light';
  return 'dark';
}

export function getFallbackOfferImage(item: CatalogItem): number {
  if (FALLBACK_IMAGE_BY_ID[item.id]) return FALLBACK_IMAGE_BY_ID[item.id];
  return getOfferCardTheme(item) === 'light'
    ? require('../assets/portuguese-lab-food.jpg')
    : require('../assets/pizza-lab-food.jpg');
}

export function getFallbackCatalog(t: TFunction): CatalogItem[] {
  return Object.entries(FALLBACK_OFFER_KEYS).map(([id, keys]) => ({
    id,
    title: t(keys.title),
    description: t(keys.description),
    restaurantName: t(keys.restaurantName),
    pointsCost: keys.pointsCost,
    imageUrl: '',
    restaurantId: '',
    expiresAt: null,
  }));
}

export function localizeCatalogItem(item: CatalogItem, t: TFunction): CatalogItem {
  const keys = FALLBACK_OFFER_KEYS[item.id];
  if (!keys) return item;
  return {
    ...item,
    title: t(keys.title),
    description: t(keys.description),
    restaurantName: t(keys.restaurantName),
  };
}

export function milestoneLabelForPts(pts: number, t: TFunction): string {
  return t(milestoneLabelKey(pts));
}
