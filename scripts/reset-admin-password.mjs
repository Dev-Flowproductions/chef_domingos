/**
 * Reset password for admin@chefdomingos.app via Auth Admin API.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/reset-admin-password.mjs
 *   # optional: ADMIN_NEW_PASSWORD=... to set a known password
 *
 * Reads EXPO_PUBLIC_SUPABASE_URL from .env.local if present.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const ADMIN_EMAIL = 'admin@chefdomingos.app';

function loadEnvLocal() {
  const path = new URL('../.env.local', import.meta.url);
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

const fileEnv = loadEnvLocal();
const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  fileEnv.EXPO_PUBLIC_SUPABASE_URL ||
  'https://wrawujclqgxdnbddwokv.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const newPassword =
  process.env.ADMIN_NEW_PASSWORD ||
  `Cd!${randomBytes(12).toString('base64url')}`;

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 200 });
if (listErr) {
  console.error(listErr.message);
  process.exit(1);
}
const user = list.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL);
if (!user) {
  console.error(`User not found: ${ADMIN_EMAIL}`);
  process.exit(1);
}

const { error } = await admin.auth.admin.updateUserById(user.id, {
  password: newPassword,
  app_metadata: { ...(user.app_metadata ?? {}), is_admin: true },
});
if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(`Password reset for ${ADMIN_EMAIL}`);
console.log(`New password: ${newPassword}`);
console.log('Store this securely and share only with restaurant admins.');
