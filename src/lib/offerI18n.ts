import type { TFunction } from 'i18next';
import type { CatalogItem } from '../services/lkm/vouchers';

export type OfferCardTheme = 'light' | 'dark';

const FALLBACK_OFFER_KEYS: Record<
  string,
  {
    title: string;
    description: string;
    restaurantName: string;
    pointsCost: number;
    theme: OfferCardTheme;
  }
> = {
  f1: {
    title: 'offers.f1.title',
    description: 'offers.f1.description',
    restaurantName: 'offers.f1.tag',
    pointsCost: 100,
    theme: 'dark',
  },
  f2: {
    title: 'offers.f2.title',
    description: 'offers.f2.description',
    restaurantName: 'offers.f2.tag',
    pointsCost: 200,
    theme: 'light',
  },
  f3: {
    title: 'offers.f3.title',
    description: 'offers.f3.description',
    restaurantName: 'offers.f3.tag',
    pointsCost: 300,
    theme: 'dark',
  },
};

const FALLBACK_IMAGE_BY_ID: Record<string, number> = {
  f1: require('../assets/pizza-lab-food.jpg'),
  f2: require('../assets/portuguese-lab-food.jpg'),
  f3: require('../assets/pizza-lab-food.jpg'),
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
  if (pts >= 900) return t('rewards.tierMeal');
  if (pts >= 600) return t('rewards.tierDessert');
  if (pts >= 300) return t('rewards.tierCoffee');
  return '';
}
