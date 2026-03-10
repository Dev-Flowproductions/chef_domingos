export interface POSProvider {
  syncMenu(): Promise<void>;
  createOrder(order: unknown): Promise<unknown>;
  getOrderStatus(orderId: string): Promise<string>;
}
