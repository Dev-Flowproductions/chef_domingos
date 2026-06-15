// LKM API client for Supabase Edge Functions (Deno runtime)
// Handles: HMAC-SHA256 signing, AppJwtToken caching, ClientJwtToken fetching

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { md5Hex } from './md5.ts';

let LKM_BASE_URL = Deno.env.get('LKM_BASE_URL')?.replace(/\/$/, '') ?? '';
let LKM_TOKEN_APP = Deno.env.get('LKM_TOKEN_APP') ?? '';
let LKM_HMAC_SECRET =
  Deno.env.get('LKM_HMAC_SECRET') ?? Deno.env.get('LKM_PARTNER_KEY') ?? '';
let LKM_STORE_ID = Deno.env.get('LKM_STORE_EXTERNAL_ID') ?? '';
export let LKM_GRUPO_DESCONTO = Number(Deno.env.get('LKM_GRUPO_DESCONTO') ?? '0');

let _configLoaded = false;

async function loadLkmConfig(): Promise<void> {
  if (_configLoaded) return;

  if (LKM_BASE_URL && LKM_TOKEN_APP && LKM_HMAC_SECRET && LKM_STORE_ID) {
    _configLoaded = true;
    return;
  }

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data, error } = await db.from('lkm_runtime_config').select('key, value');
  if (error) {
    console.warn('[lkm-client] loadLkmConfig failed:', error.message);
  } else {
    for (const row of data ?? []) {
      if (row.key === 'LKM_BASE_URL') LKM_BASE_URL = String(row.value).replace(/\/$/, '');
      if (row.key === 'LKM_TOKEN_APP') LKM_TOKEN_APP = String(row.value);
      if (row.key === 'LKM_HMAC_SECRET') LKM_HMAC_SECRET = String(row.value);
      if (row.key === 'LKM_STORE_EXTERNAL_ID') LKM_STORE_ID = String(row.value);
      if (row.key === 'LKM_GRUPO_DESCONTO') LKM_GRUPO_DESCONTO = Number(row.value);
    }
  }

  _configLoaded = true;
}

export async function getLkmConfig() {
  await loadLkmConfig();
  return { grupoDesconto: LKM_GRUPO_DESCONTO, storeId: LKM_STORE_ID };
}

function assertLkmConfig() {
  const missing: string[] = [];
  if (!LKM_BASE_URL) missing.push('LKM_BASE_URL');
  if (!LKM_TOKEN_APP) missing.push('LKM_TOKEN_APP');
  if (!LKM_HMAC_SECRET) missing.push('LKM_HMAC_SECRET (PartnerKey)');
  if (!LKM_STORE_ID) missing.push('LKM_STORE_EXTERNAL_ID');
  if (missing.length) {
    throw new Error(
      `LKM not configured. Set Supabase secrets or lkm_runtime_config rows: ${missing.join(', ')}`,
    );
  }
}

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ── HMAC-SHA256 signing ───────────────────────────────────────────────────────
// X-Signature format: <timestamp>:<nonce>:<hmac-sha256-hex>
// Message to sign:    <nonce> + <timestamp> + <md5(body)>

async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function buildSignature(body?: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce     = generateNonce();
  const bodyHash  = md5Hex(body ?? '');
  const message   = nonce + timestamp + bodyHash;
  const sig       = await hmacSha256Hex(message, LKM_HMAC_SECRET);
  return `${timestamp}:${nonce}:${sig}`;
}

// ── App token (cached in lkm_token_cache table) ───────────────────────────────

let _appToken: string | null = null;
let _appTokenExpiry: number = 0;

async function getAppToken(): Promise<string> {
  await loadLkmConfig();
  assertLkmConfig();
  const now = Date.now();

  // In-memory cache within same function invocation
  if (_appToken && now < _appTokenExpiry) return _appToken;

  // Try DB cache first
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE);
  const { data } = await db
    .from('lkm_token_cache')
    .select('token, expires_at')
    .eq('key', 'app_token')
    .single();

  if (data && new Date(data.expires_at).getTime() > now + 60_000) {
    _appToken = data.token;
    _appTokenExpiry = new Date(data.expires_at).getTime();
    return _appToken!;
  }

  // Fetch fresh token from LKM
  const path = '/api/auth/applicationtoken';
  const sig   = await buildSignature();

  const res = await fetch(`${LKM_BASE_URL}${path}`, {
    headers: {
      TokenApp:         LKM_TOKEN_APP,
      StoreExternalId:  LKM_STORE_ID,
      'X-Signature':    sig,
    },
  });

  if (!res.ok) {
    throw new Error(`LKM getAppToken failed: ${res.status} ${await res.text()}`);
  }

  const token = (await res.text()).replace(/"/g, '');
  const expiresAt = new Date(now + 55 * 60 * 1000); // treat as ~55 min TTL

  // Persist to DB cache
  await db.from('lkm_token_cache').upsert({
    key: 'app_token',
    token,
    expires_at: expiresAt.toISOString(),
    updated_at: new Date().toISOString(),
  });

  _appToken = token;
  _appTokenExpiry = expiresAt.getTime();
  return token;
}

// ── Client token ──────────────────────────────────────────────────────────────

export async function getClientToken(accessToken: string): Promise<string> {
  const appToken = await getAppToken();
  const path     = '/api/auth/clienttoken';
  const sig      = await buildSignature();

  const res = await fetch(`${LKM_BASE_URL}${path}`, {
    headers: {
      TokenApp:         LKM_TOKEN_APP,
      AccessToken:      accessToken,
      StoreExternalId:  LKM_STORE_ID,
      Authorization:    `Bearer ${appToken}`,
      'X-Signature':    sig,
    },
  });

  if (!res.ok) {
    throw new Error(`LKM getClientToken failed: ${res.status} ${await res.text()}`);
  }

  return (await res.text()).replace(/"/g, '');
}

// ── Core fetch helper ─────────────────────────────────────────────────────────

export interface LkmFetchOptions {
  method?: string;
  body?: unknown;
  clientToken?: string; // if provided, use ClientJwt; otherwise use AppJwt
  queryParams?: Record<string, string | number | boolean | undefined>;
}

export async function lkmFetch<T = unknown>(
  path: string,
  opts: LkmFetchOptions = {},
): Promise<T> {
  await loadLkmConfig();
  const { method = 'GET', body, clientToken, queryParams } = opts;

  const jwt = clientToken ?? (await getAppToken());
  const bodyStr = body != null ? JSON.stringify(body) : undefined;
  const sig = await buildSignature(bodyStr);

  let url = `${LKM_BASE_URL}${path}`;
  if (queryParams) {
    const qs = Object.entries(queryParams)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${jwt}`,
    'X-Signature': sig,
    'Content-Type': 'application/json',
  };

  const res = await fetch(url, {
    method,
    headers,
    body: bodyStr,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new LkmApiError(res.status, text);
  }

  const text = await res.text();
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

// ── Error class ───────────────────────────────────────────────────────────────

export class LkmApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'LkmApiError';
  }
}

// ── Auth helper: extract Supabase user from request ───────────────────────────

export async function getSupabaseUser(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) throw new Error('Missing Authorization header');

  // Use anon client to verify the user JWT
  const db = createClient(
    SUPABASE_URL,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new Error('Invalid or expired session');

  return { user: data.user, token };
}

// ── DB helper: service-role client ───────────────────────────────────────────

export function serviceDb() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE);
}

// ── Util: get user's LKM card code from DB ────────────────────────────────────

export async function getLkmCard(userId: string): Promise<{ cardCode: string; accessToken: string }> {
  const db = serviceDb();
  const { data, error } = await db
    .from('users')
    .select('lkm_card_code, lkm_access_token')
    .eq('id', userId)
    .single();

  if (error || !data?.lkm_card_code) {
    throw new Error('LKM card not linked for this user. Please complete registration.');
  }

  return { cardCode: data.lkm_card_code, accessToken: data.lkm_access_token };
}

// ── Util: JSON response helper ────────────────────────────────────────────────

export function jsonResponse(
  data: unknown,
  init: ResponseInit & { headers?: Record<string, string> } = {},
) {
  const { headers = {}, ...rest } = init;
  return new Response(JSON.stringify(data), {
    status: 200,
    ...rest,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
