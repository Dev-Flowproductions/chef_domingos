export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  preferred_language?: 'pt' | 'en';
  notification_settings?: Record<string, boolean>;
  created_at: string;
}

export interface Pizza {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  winrest_id?: string;
}

export interface CartItem {
  pizza: Pizza;
  quantity: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  pizza_id: string;
  quantity: number;
  price: number;
  pizza?: Pizza;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_price: number;
  pos_id?: string;
  pos_status?: string;
  created_at: string;
  order_items?: OrderItem[];
}

export interface CreateOrderPayload {
  items: {
    pizza_id: string;
    quantity: number;
  }[];
}
