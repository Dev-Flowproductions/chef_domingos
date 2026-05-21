// Base client for calling Supabase Edge Functions (LKM proxy)
// Automatically attaches the current Supabase session JWT.

import { supabase } from '../../lib/supabase';

const BASE = process.env.EXPO_PUBLIC_SUPABASE_URL
  ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`
  : '';

export class LkmServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'LkmServiceError';
  }
}

async function getAuthHeader(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new LkmServiceError(401, 'Not authenticated');
  return `Bearer ${token}`;
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

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    body: body != null ? JSON.stringify(body) : undefined,
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
