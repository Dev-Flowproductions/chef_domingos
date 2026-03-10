import { supabase } from '../../lib/supabase';
import { Pizza } from '../../types';

export async function fetchPizzas(): Promise<Pizza[]> {
  const { data, error } = await supabase
    .from('pizzas')
    .select('id, name, description, price, image_url, category, winrest_id')
    .order('name');

  if (error) throw error;
  return data ?? [];
}

export async function fetchPizzaById(id: string): Promise<Pizza> {
  const { data, error } = await supabase
    .from('pizzas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}
