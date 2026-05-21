import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { USE_MOCK } from '../lib/config';
import { MOCK_USER } from '../lib/mockData';
import { registerEmailWithLkm } from '../services/lkm/auth';
import { ensureUserRow } from '../lib/ensureUserProfile';
import { withTimeout } from '../lib/withTimeout';
import { useUserStore } from './userStore';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

const MOCK_SESSION = {
  user: {
    id: MOCK_USER.id,
    email: MOCK_USER.email,
    user_metadata: { name: MOCK_USER.name },
    app_metadata: {},
    aud: 'authenticated',
    created_at: MOCK_USER.created_at,
  },
} as unknown as Session;

export const useAuthStore = create<AuthState>((set) => ({
  session: USE_MOCK ? MOCK_SESSION : null,
  user: USE_MOCK ? MOCK_SESSION.user as unknown as User : null,
  loading: !USE_MOCK,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  signIn: async (_email, _password) => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      set({ session: MOCK_SESSION, user: MOCK_SESSION.user as unknown as User });
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({ email: _email, password: _password });
    return { error };
  },

  signUp: async (_email, _password, _name) => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      set({ session: MOCK_SESSION, user: MOCK_SESSION.user as unknown as User });
      return { error: null };
    }
    const { data, error } = await supabase.auth.signUp({
      email: _email,
      password: _password,
      options: { data: { name: _name } },
    });
    if (error) return { error };

    // After Supabase signup succeeds, also register in LKM loyalty system.
    // Non-fatal: if LKM registration fails the user can link their card later.
    if (data.session?.user) {
      await ensureUserRow(data.session.user);
      try {
        await registerEmailWithLkm({ name: _name, email: _email, password: _password });
      } catch (lkmErr) {
        console.warn('[authStore] LKM registration failed, will retry on next login:', lkmErr);
      }
    }

    return { error: null };
  },

  signOut: async () => {
    if (!USE_MOCK) await supabase.auth.signOut();
    set({ session: null, user: null });
  },

  initialize: async () => {
    if (USE_MOCK) {
      set({ session: MOCK_SESSION, user: MOCK_SESSION.user as unknown as User, loading: false });
      return;
    }

    try {
      const { data } = await withTimeout(
        supabase.auth.getSession(),
        8000,
        'auth.getSession',
      ) as Awaited<ReturnType<typeof supabase.auth.getSession>>;
      set({ session: data.session, user: data.session?.user ?? null, loading: false });
      if (data.session?.user) {
        void ensureUserRow(data.session.user).catch((err) => {
          console.warn('[authStore] ensureUserRow failed:', err);
        });
      }
    } catch (err) {
      console.warn('[authStore] initialize failed, continuing without session:', err);
      set({ session: null, user: null, loading: false });
    }

    supabase.auth.onAuthStateChange((_event: unknown, session: Session | null) => {
      set({ session, user: session?.user ?? null });
      if (session?.user) {
        void ensureUserRow(session.user).catch((err) => {
          console.warn('[authStore] ensureUserRow failed:', err);
        });
      } else {
        useUserStore.getState().clearProfile();
      }
    });
  },
}));
