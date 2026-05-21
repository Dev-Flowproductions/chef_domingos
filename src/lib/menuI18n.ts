export const RESTAURANT_IDS = ['portugueseLab', 'pizzaLab'] as const;
export type RestaurantId = (typeof RESTAURANT_IDS)[number];

export interface RestaurantMenuConfig {
  defaultCategory: string;
  categories: readonly string[];
  items: Record<string, readonly string[]>;
}

export const RESTAURANT_MENUS: Record<RestaurantId, RestaurantMenuConfig> = {
  portugueseLab: {
    defaultCategory: 'principais',
    categories: ['menus', 'principais', 'vegetariano', 'sobremesa'],
    items: {
      menus: ['menuDoDia', 'menuExecutive', 'menuFamilia'],
      principais: [
        'medalhoesNovilho',
        'escalopesFrango',
        'bifinhoFrango',
        'bacalhauBras',
        'salmaoGrelhado',
      ],
      vegetariano: ['risottoCogumelos', 'lasanhaLegumes', 'saladaCaesar'],
      sobremesa: ['pastelNata', 'mousseChocolate', 'pudimFlan', 'tarteMaca'],
    },
  },
  pizzaLab: {
    defaultCategory: 'pizzas',
    categories: ['pizzas', 'entradas', 'bebidas', 'sobremesa'],
    items: {
      pizzas: [
        'margherita',
        'pepperoni',
        'quattroFormaggi',
        'diavola',
        'vegetariana',
        'prosciuttoRucola',
      ],
      entradas: ['paoAlho', 'bruschetta', 'saladaMista'],
      bebidas: ['agua', 'refrigerante', 'sumoLaranja', 'cerveja'],
      sobremesa: ['tiramisu', 'gelado', 'brownieChocolate'],
    },
  },
};

export function getRestaurantMenu(restaurantId: RestaurantId): RestaurantMenuConfig {
  return RESTAURANT_MENUS[restaurantId];
}
