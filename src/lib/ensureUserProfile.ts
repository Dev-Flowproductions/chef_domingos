import type { User as AuthUser } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { USE_MOCK } from './config';

export async function ensureUserRow(user: AuthUser): Promise<void> {
  if (USE_MOCK) return;

  const name = (user.user_metadata?.name as string | undefined) ?? '';
  const email = user.email ?? '';

  await supabase.from('users').upsert(
    {
      id: user.id,
      email,
      name: name || email.split('@')[0],
      phone: '',
    },
    { onConflict: 'id' },
  );
}
