import { supabase } from '../../lib/supabase';
import { CreateOrderPayload, Order } from '../../types';

export async function fetchOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, pizza:pizzas(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchOrderById(orderId: string): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, pizza:pizzas(*))')
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data;
}

export async function createOrder(
  userId: string,
  payload: CreateOrderPayload,
  totalPrice: number
): Promise<Order> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ user_id: userId, status: 'pending', total_price: totalPrice })
    .select()
    .single();

  if (orderError) throw orderError;

  const orderItems = payload.items.map((item) => ({
    order_id: order.id,
    pizza_id: item.pizza_id,
    quantity: item.quantity,
    price: item.quantity,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

  if (itemsError) throw itemsError;

  return order;
}
