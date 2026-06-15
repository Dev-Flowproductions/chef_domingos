import { supabase } from '../../lib/supabase';
import { USE_MOCK } from '../../lib/config';
import { MOCK_ORDERS, MOCK_USER } from '../../lib/mockData';
import { CreateOrderPayload, Order } from '../../types';

let mockOrders = [...MOCK_ORDERS];

export async function fetchOrders(userId: string): Promise<Order[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return mockOrders.filter((o) => o.user_id === userId || o.user_id === MOCK_USER.id);
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, pizza:pizzas(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchOrderById(orderId: string): Promise<Order> {
  if (USE_MOCK) {
    const order = mockOrders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');
    return order;
  }

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
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      user_id: userId,
      status: 'pending',
      total_price: totalPrice,
      created_at: new Date().toISOString(),
      order_items: payload.items.map((item, i) => ({
        id: `item-${Date.now()}-${i}`,
        order_id: `order-${Date.now()}`,
        pizza_id: item.pizza_id,
        quantity: item.quantity,
        price: totalPrice / payload.items.length,
      })),
    };
    mockOrders = [newOrder, ...mockOrders];
    return newOrder;
  }

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
