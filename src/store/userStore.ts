import { create } from 'zustand';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface UserState {
  profile: User | null;
  loading: boolean;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<{ error: Error | null }>;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  loading: false,

  fetchProfile: async (userId) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error) set({ profile: data });
    set({ loading: false });
  },

  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (!error && data) set({ profile: data });
    return { error };
  },

  clearProfile: () => set({ profile: null }),
}));
