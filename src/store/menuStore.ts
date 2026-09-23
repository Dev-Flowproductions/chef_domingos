import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { USE_MOCK } from '../lib/config';
import {
  RESTAURANT_MENUS,
  type RestaurantId,
} from '../lib/menuI18n';
import {
  MENU_ITEM_PRICES,
  listMenuItems as listStaticMenuItems,
  type MenuItemRef,
} from '../lib/menuCatalog';

export interface MenuItemRow {
  id: string;
  restaurant_id: RestaurantId;
  category_id: string;
  item_key: string;
  name_pt: string;
  name_en: string;
  description_pt: string | null;
  description_en: string | null;
  price_euros: number;
  sort_order: number;
  is_active: boolean;
}

interface MenuState {
  items: MenuItemRow[];
  loading: boolean;
  loaded: boolean;
  fetchMenus: (opts?: { includeInactive?: boolean }) => Promise<void>;
  createItem: (input: {
    restaurantId: RestaurantId;
    categoryId: string;
    namePt: string;
    nameEn: string;
    descriptionPt?: string;
    descriptionEn?: string;
    priceEuros: number;
  }) => Promise<{ error: Error | null }>;
  updateItem: (
    id: string,
    updates: Partial<{
      name_pt: string;
      name_en: string;
      description_pt: string | null;
      description_en: string | null;
      price_euros: number;
      category_id: string;
    }>,
  ) => Promise<{ error: Error | null }>;
  removeItem: (id: string) => Promise<{ error: Error | null }>;
}

function slugifyKey(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 36);
  return `${base || 'item'}_${Date.now().toString(36).slice(-5)}`;
}

function staticFallbackRows(): MenuItemRow[] {
  const out: MenuItemRow[] = [];
  for (const restaurantId of Object.keys(RESTAURANT_MENUS) as RestaurantId[]) {
    const refs = listStaticMenuItems(restaurantId);
    refs.forEach((ref, idx) => {
      out.push({
        id: `static-${restaurantId}-${ref.itemKey}`,
        restaurant_id: restaurantId,
        category_id: ref.categoryId,
        item_key: ref.itemKey,
        name_pt: ref.itemKey,
        name_en: ref.itemKey,
        description_pt: null,
        description_en: null,
        price_euros: ref.priceEuros,
        sort_order: idx,
        is_active: true,
      });
    });
  }
  return out;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,

  fetchMenus: async (opts) => {
    const includeInactive = Boolean(opts?.includeInactive);
    if (USE_MOCK) {
      set({ items: staticFallbackRows(), loading: false, loaded: true });
      return;
    }
    set({ loading: true });
    let query = supabase
      .from('menu_items')
      .select(
        'id, restaurant_id, category_id, item_key, name_pt, name_en, description_pt, description_en, price_euros, sort_order, is_active',
      )
      .order('sort_order', { ascending: true });
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('[menuStore] fetchMenus failed, using static fallback:', error.message);
      set({ items: staticFallbackRows(), loading: false, loaded: true });
      return;
    }
    if (!data?.length) {
      set({ items: staticFallbackRows(), loading: false, loaded: true });
      return;
    }
    set({
      items: (data as MenuItemRow[]).map((row) => ({
        ...row,
        restaurant_id: row.restaurant_id as RestaurantId,
        price_euros: Number(row.price_euros),
      })),
      loading: false,
      loaded: true,
    });
  },

  createItem: async (input) => {
    const itemKey = slugifyKey(input.namePt || input.nameEn);
    const siblings = get().items.filter(
      (i) => i.restaurant_id === input.restaurantId && i.category_id === input.categoryId,
    );
    const sortOrder = siblings.reduce((max, i) => Math.max(max, i.sort_order), 0) + 1;
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        restaurant_id: input.restaurantId,
        category_id: input.categoryId,
        item_key: itemKey,
        name_pt: input.namePt.trim(),
        name_en: (input.nameEn || input.namePt).trim(),
        description_pt: input.descriptionPt?.trim() || null,
        description_en: input.descriptionEn?.trim() || null,
        price_euros: input.priceEuros,
        sort_order: sortOrder,
        is_active: true,
      })
      .select(
        'id, restaurant_id, category_id, item_key, name_pt, name_en, description_pt, description_en, price_euros, sort_order, is_active',
      )
      .single();
    if (error) return { error: new Error(error.message) };
    set({
      items: [
        ...get().items,
        {
          ...data,
          restaurant_id: data.restaurant_id as RestaurantId,
          price_euros: Number(data.price_euros),
        },
      ],
    });
    return { error: null };
  },

  updateItem: async (id, updates) => {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(
        'id, restaurant_id, category_id, item_key, name_pt, name_en, description_pt, description_en, price_euros, sort_order, is_active',
      )
      .single();
    if (error) return { error: new Error(error.message) };
    set({
      items: get().items.map((item) =>
        item.id === id
          ? {
              ...data,
              restaurant_id: data.restaurant_id as RestaurantId,
              price_euros: Number(data.price_euros),
            }
          : item,
      ),
    });
    return { error: null };
  },

  removeItem: async (id) => {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { error: new Error(error.message) };
    set({ items: get().items.filter((item) => item.id !== id) });
    return { error: null };
  },
}));

export function itemsForRestaurant(
  items: MenuItemRow[],
  restaurantId: RestaurantId,
  opts?: { forAdminPromo?: boolean },
): MenuItemRow[] {
  const excluded = new Set(RESTAURANT_MENUS[restaurantId].adminExcludedCategories ?? []);
  return items
    .filter((i) => i.restaurant_id === restaurantId && i.is_active)
    .filter((i) => !(opts?.forAdminPromo && excluded.has(i.category_id)))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function toMenuItemRefs(items: MenuItemRow[], restaurantId: RestaurantId): MenuItemRef[] {
  return itemsForRestaurant(items, restaurantId).map((i) => ({
    restaurantId,
    categoryId: i.category_id,
    itemKey: i.item_key,
    priceEuros: i.price_euros,
  }));
}

export function formatMenuPrice(price: number, locale: 'pt' | 'en'): string {
  if (locale === 'pt') return `${price.toFixed(2).replace('.', ',')}€`;
  return `€${price.toFixed(2)}`;
}

export function localizedName(item: MenuItemRow, locale: 'pt' | 'en'): string {
  return locale === 'pt' ? item.name_pt : item.name_en;
}

export function localizedDescription(item: MenuItemRow, locale: 'pt' | 'en'): string | null {
  return locale === 'pt' ? item.description_pt : item.description_en;
}

/** Price lookup for promo math — prefers live store, falls back to static catalog. */
export function priceForItem(restaurantId: RestaurantId, itemKey: string, items: MenuItemRow[]): number | null {
  const live = items.find((i) => i.restaurant_id === restaurantId && i.item_key === itemKey && i.is_active);
  if (live) return live.price_euros;
  return MENU_ITEM_PRICES[restaurantId]?.[itemKey] ?? null;
}
