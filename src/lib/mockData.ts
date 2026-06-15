import { Pizza, Order, User } from '../types';

export const MOCK_USER: User = {
  id: 'mock-user-001',
  email: 'demo@pizzalab.com',
  name: 'Demo User',
  phone: '+351 912 345 678',
  created_at: new Date().toISOString(),
};

export const MOCK_PIZZAS: Pizza[] = [
  {
    id: 'pizza-001',
    name: 'Margherita',
    description: 'Classic tomato sauce, fresh mozzarella, and basil on a thin crispy crust.',
    price: 9.5,
    image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600',
    category: 'Classic',
  },
  {
    id: 'pizza-002',
    name: 'Pepperoni',
    description: 'Generous layers of spicy pepperoni with melted mozzarella and tomato sauce.',
    price: 11.5,
    image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600',
    category: 'Meat',
  },
  {
    id: 'pizza-003',
    name: 'Quattro Formaggi',
    description: 'Four cheese blend: mozzarella, gorgonzola, parmesan, and ricotta.',
    price: 13.0,
    image_url: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=600',
    category: 'Classic',
  },
  {
    id: 'pizza-004',
    name: 'Diavola',
    description: 'Spicy salami, chili flakes, tomato sauce, and mozzarella.',
    price: 12.5,
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
    category: 'Meat',
  },
  {
    id: 'pizza-005',
    name: 'Vegetariana',
    description: 'Grilled peppers, mushrooms, olives, cherry tomatoes, and fresh basil.',
    price: 10.5,
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600',
    category: 'Vegetarian',
  },
  {
    id: 'pizza-006',
    name: 'Prosciutto e Rucola',
    description: 'Parma ham, fresh rocket, cherry tomatoes, and shaved parmesan.',
    price: 14.0,
    image_url: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600',
    category: 'Premium',
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'order-001',
    user_id: MOCK_USER.id,
    status: 'completed',
    total_price: 23.0,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    order_items: [
      {
        id: 'item-001',
        order_id: 'order-001',
        pizza_id: 'pizza-001',
        quantity: 2,
        price: 9.5,
        pizza: MOCK_PIZZAS[0],
      },
      {
        id: 'item-002',
        order_id: 'order-001',
        pizza_id: 'pizza-003',
        quantity: 1,
        price: 13.0,
        pizza: MOCK_PIZZAS[2],
      },
    ],
  },
  {
    id: 'order-002',
    user_id: MOCK_USER.id,
    status: 'preparing',
    total_price: 24.0,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    order_items: [
      {
        id: 'item-003',
        order_id: 'order-002',
        pizza_id: 'pizza-002',
        quantity: 2,
        price: 11.5,
        pizza: MOCK_PIZZAS[1],
      },
      {
        id: 'item-004',
        order_id: 'order-002',
        pizza_id: 'pizza-006',
        quantity: 1,
        price: 14.0,
        pizza: MOCK_PIZZAS[5],
      },
    ],
  },
];
