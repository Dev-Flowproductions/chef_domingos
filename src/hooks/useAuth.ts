import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { session, user, loading, signIn, signUp, signOut, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  return { session, user, loading, signIn, signUp, signOut };
}
