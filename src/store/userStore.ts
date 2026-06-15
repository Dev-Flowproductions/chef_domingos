import { create } from 'zustand';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { USE_MOCK } from '../lib/config';
import { MOCK_USER } from '../lib/mockData';

interface UserState {
  profile: User | null;
  loading: boolean;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<{ error: Error | null }>;
  clearProfile: () => void;
}

let mockProfile = { ...MOCK_USER };

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  loading: false,

  fetchProfile: async (_userId) => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      set({ profile: mockProfile });
      return;
    }
    set({ loading: true });
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', _userId)
      .single();
    if (!error) set({ profile: data });
    set({ loading: false });
  },

  updateProfile: async (_userId, updates) => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      mockProfile = { ...mockProfile, ...updates };
      set({ profile: mockProfile });
      return { error: null };
    }
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', _userId)
      .select()
      .single();
    if (!error && data) set({ profile: data });
    return { error };
  },

  clearProfile: () => set({ profile: null }),
}));
