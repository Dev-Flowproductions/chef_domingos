import { supabase } from '../../lib/supabase';
import { USE_MOCK } from '../../lib/config';
import { MOCK_PIZZAS } from '../../lib/mockData';
import { Pizza } from '../../types';

export async function fetchPizzas(): Promise<Pizza[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return MOCK_PIZZAS;
  }

  const { data, error } = await supabase
    .from('pizzas')
    .select('id, name, description, price, image_url, category, winrest_id')
    .order('name');

  if (error) throw error;
  return data ?? [];
}

export async function fetchPizzaById(id: string): Promise<Pizza> {
  if (USE_MOCK) {
    const pizza = MOCK_PIZZAS.find((p) => p.id === id);
    if (!pizza) throw new Error('Pizza not found');
    return pizza;
  }

  const { data, error } = await supabase
    .from('pizzas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}
