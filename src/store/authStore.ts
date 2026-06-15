import { create } from 'zustand';
import { AppState, type AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { USE_MOCK } from '../lib/config';
import { MOCK_USER } from '../lib/mockData';
import { ensureLkmCardLinked } from '../services/lkm/ensureCard';
import { ensureUserRow } from '../lib/ensureUserProfile';
import { withTimeout } from '../lib/withTimeout';
import { useUserStore } from './userStore';

const LKM_PENDING_PWD_KEY = 'lkm_pending_password';

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

let authListenerRegistered = false;
let initInFlight: Promise<void> | null = null;

function setupAuthLifecycle() {
  if (authListenerRegistered || USE_MOCK) return;
  authListenerRegistered = true;

  const onAppStateChange = (state: AppStateStatus) => {
    const hasSession = !!useAuthStore.getState().session;
    if (!hasSession) return;
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  };

  AppState.addEventListener('change', onAppStateChange);

  supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
    useAuthStore.getState().setSession(session);

    if (event === 'SIGNED_OUT') {
      useUserStore.getState().clearProfile();
    }
  });
}

async function clearLocalAuthSession() {
  try {
    await supabase.auth.stopAutoRefresh();
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // ignore — best effort when offline
  }
}

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
    if (error) return { error };

    // Save password so initialize() can retry LKM registration after app restarts
    await SecureStore.setItemAsync(LKM_PENDING_PWD_KEY, _password).catch(() => {});

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const displayName =
        (sessionData.session?.user.user_metadata?.name as string | undefined) ||
        _email.split('@')[0];
      if (sessionData.session?.user) {
        await ensureUserRow(sessionData.session.user);
      }
      const lkmResult = await ensureLkmCardLinked({ name: displayName, password: _password });
      if (lkmResult.linked) {
        await SecureStore.deleteItemAsync(LKM_PENDING_PWD_KEY).catch(() => {});
      }
    } catch (lkmErr) {
      console.warn('[authStore] LKM link on login failed:', lkmErr);
    }

    return { error: null };
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
      // Save password so initialize() can retry LKM registration after app restarts
      await SecureStore.setItemAsync(LKM_PENDING_PWD_KEY, _password).catch(() => {});
      try {
        const lkmResult = await ensureLkmCardLinked({ name: _name, password: _password });
        if (lkmResult.linked) {
          await SecureStore.deleteItemAsync(LKM_PENDING_PWD_KEY).catch(() => {});
        }
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

    if (initInFlight) {
      await initInFlight;
      return;
    }

    initInFlight = (async () => {
      setupAuthLifecycle();
      await supabase.auth.stopAutoRefresh();

      try {
        const { data } = await withTimeout(
          supabase.auth.getSession(),
          8000,
          'auth.getSession',
        ) as Awaited<ReturnType<typeof supabase.auth.getSession>>;
        set({ session: data.session, user: data.session?.user ?? null, loading: false });
        if (data.session) {
          void supabase.auth.startAutoRefresh();
        }
        if (data.session?.user) {
          void ensureUserRow(data.session.user).catch((err) => {
            console.warn('[authStore] ensureUserRow failed:', err);
          });
          void (async () => {
            try {
              const pendingPwd = await SecureStore.getItemAsync(LKM_PENDING_PWD_KEY).catch(() => null);
              const displayName =
                (data.session!.user.user_metadata?.name as string | undefined) ||
                data.session!.user.email?.split('@')[0] ||
                'Cliente';
              const lkmResult = await ensureLkmCardLinked(
                pendingPwd ? { name: displayName, password: pendingPwd } : undefined,
              );
              if (lkmResult.linked && pendingPwd) {
                await SecureStore.deleteItemAsync(LKM_PENDING_PWD_KEY).catch(() => {});
              }
            } catch (err) {
              console.warn('[authStore] ensureLkmCardLinked failed:', err);
            }
          })();
        }
      } catch (err) {
        console.warn('[authStore] initialize failed, continuing without session:', err);
        await clearLocalAuthSession();
        set({ session: null, user: null, loading: false });
        throw err;
      }
    })();

    try {
      await initInFlight;
    } catch {
      initInFlight = null;
    }
  },
}));
