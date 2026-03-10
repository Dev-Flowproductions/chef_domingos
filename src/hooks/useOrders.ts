import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '../services/api/orders';
import { useAuthStore } from '../store/authStore';

export function useOrders() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['orders', user?.id],
    queryFn: () => fetchOrders(user!.id),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}
