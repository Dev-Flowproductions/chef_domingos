import { useQuery } from '@tanstack/react-query';
import { fetchPizzas } from '../services/api/pizzas';

export function useMenu() {
  return useQuery({
    queryKey: ['pizzas'],
    queryFn: fetchPizzas,
    staleTime: 5 * 60 * 1000,
  });
}
