// Base client for calling Supabase Edge Functions (LKM proxy)
// Automatically attaches the current Supabase session JWT.

import { fetchWithTimeout } from '../../lib/fetchWithTimeout';
import { supabase } from '../../lib/supabase';
import { withTimeout } from '../../lib/withTimeout';

const BASE = process.env.EXPO_PUBLIC_SUPABASE_URL
  ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`
  : '';

export class LkmServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'LkmServiceError';
  }
}

async function getAccessToken(): Promise<string> {
  const { data } = await withTimeout(
    supabase.auth.getSession(),
    8000,
    'lkm.getSession',
  ) as Awaited<ReturnType<typeof supabase.auth.getSession>>;

  let session = data.session;
  if (!session?.access_token) throw new LkmServiceError(401, 'Not authenticated');

  const expiresAtMs = (session.expires_at ?? 0) * 1000;
  if (expiresAtMs < Date.now() + 60_000) {
    const { data: refreshed, error } = await withTimeout(
      supabase.auth.refreshSession(),
      8000,
      'lkm.refreshSession',
    ) as Awaited<ReturnType<typeof supabase.auth.refreshSession>>;
    if (error || !refreshed.session?.access_token) {
      throw new LkmServiceError(401, 'Session expired — please sign in again');
    }
    session = refreshed.session;
  }

  return session.access_token;
}

async function getAuthHeader(): Promise<string> {
  return `Bearer ${await getAccessToken()}`;
}

interface FetchOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

export async function lkmCall<T = unknown>(
  functionName: string,
  opts: FetchOptions = {},
): Promise<T> {
  const { method = 'GET', body, query } = opts;

  let url = `${BASE}/${functionName}`;
  if (query) {
    const qs = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  const authHeader = await getAuthHeader();

  const res = await fetchWithTimeout(url, {
    method,
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    body: body != null ? JSON.stringify(body) : undefined,
  }).catch((err: Error) => {
    throw new LkmServiceError(0, err.message || 'Network request failed');
  });

  const text = await res.text();
  let json: unknown;
  try { json = JSON.parse(text); } catch { json = { message: text }; }

  if (!res.ok) {
    const msg = (json as any)?.error ?? (json as any)?.message ?? `HTTP ${res.status}`;
    throw new LkmServiceError(res.status, msg);
  }

  return json as T;
}
