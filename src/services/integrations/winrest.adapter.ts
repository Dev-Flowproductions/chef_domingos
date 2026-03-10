import { POSProvider } from './pos.interface';

/**
 * WinRest POS adapter — NOT implemented in MVP.
 * Placeholder for future integration via Supabase Edge Functions.
 */
export class WinRestAdapter implements POSProvider {
  async syncMenu(): Promise<void> {
    throw new Error('WinRest integration not yet implemented');
  }

  async createOrder(_order: unknown): Promise<unknown> {
    throw new Error('WinRest integration not yet implemented');
  }

  async getOrderStatus(_orderId: string): Promise<string> {
    throw new Error('WinRest integration not yet implemented');
  }
}
