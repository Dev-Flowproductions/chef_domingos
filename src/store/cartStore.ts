import { create } from 'zustand';
import { CartItem, Pizza } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (pizza: Pizza) => void;
  removeItem: (pizzaId: string) => void;
  updateQuantity: (pizzaId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (pizza) => {
    const items = get().items;
    const existing = items.find((i) => i.pizza.id === pizza.id);
    if (existing) {
      set({
        items: items.map((i) =>
          i.pizza.id === pizza.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({ items: [...items, { pizza, quantity: 1 }] });
    }
  },

  removeItem: (pizzaId) =>
    set({ items: get().items.filter((i) => i.pizza.id !== pizzaId) }),

  updateQuantity: (pizzaId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(pizzaId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.pizza.id === pizzaId ? { ...i, quantity } : i
      ),
    });
  },

  clearCart: () => set({ items: [] }),

  getTotal: () =>
    get().items.reduce((sum, i) => sum + i.pizza.price * i.quantity, 0),
}));
