import type { PosDiscount } from './posDiscountCatalog';

export type DiscountCardTheme = 'light' | 'dark';

const PORTUGUESE = require('../assets/portuguese-lab-food.jpg');

const CARD_IMAGES: Record<string, number> = {
  'money-5': require('../assets/voucher-euro-5.jpg'),
  'money-10': require('../assets/voucher-euro-10.jpg'),
  'money-20': require('../assets/voucher-euro-20.jpg'),
  'money-30': require('../assets/voucher-euro-30.jpg'),
  'percent-10': require('../assets/voucher-percent-10.jpg'),
  'percent-20': require('../assets/voucher-percent-20.jpg'),
  'percent-30': require('../assets/voucher-percent-30.jpg'),
  'special-romantic': require('../assets/voucher-romantic.jpg'),
  'special-friends': require('../assets/voucher-friends.jpg'),
};

const DARK_CARDS = new Set(['money-10', 'money-30', 'percent-20', 'special-romantic', 'special-friends']);

export function discountCardImage(id: string): number {
  return CARD_IMAGES[id] ?? PORTUGUESE;
}

export function discountCardTheme(id: string): DiscountCardTheme {
  return DARK_CARDS.has(id) ? 'dark' : 'light';
}

function moneyOfferCopyKey(euroValue: number | null): 'v5' | 'v10' | 'v20' | 'v30' {
  switch (euroValue) {
    case 5:
      return 'v5';
    case 10:
      return 'v10';
    case 20:
      return 'v20';
    case 30:
      return 'v30';
    default:
      return 'v5';
  }
}

export function discountCustomerCopy(
  discount: PosDiscount,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const till = {
    title: t(`staff.catalogItems.${discount.id}`),
    description: t('rewards.tillDiscountDescription', { count: discount.pointsCost ?? 0 }),
  };
  switch (discount.kind) {
    case 'money': {
      const offerKey = moneyOfferCopyKey(discount.euroValue);
      return {
        title: t(`offers.${offerKey}.title`),
        description: t(`offers.${offerKey}.description`),
        restaurantName: t(`offers.${offerKey}.tag`),
      };
    }
    case 'percent':
      return { ...till, restaurantName: t('staff.catalogPercent') };
    case 'article':
      return { ...till, restaurantName: t('staff.catalogArticle') };
    default: {
      const unexpected: never = discount.kind;
      return unexpected;
    }
  }
}
