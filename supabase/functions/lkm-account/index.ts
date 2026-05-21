// lkm-account Edge Function
// Routes:
//   POST /lkm-account  { action: 'register', ...fields }
//   POST /lkm-account  { action: 'link' }
//   GET  /lkm-account  → get current user's LKM profile

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import {
  lkmFetch,
  getClientToken,
  getSupabaseUser,
  serviceDb,
  jsonResponse,
  errorResponse,
  LkmApiError,
} from '../_shared/lkm-client.ts';

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${seg()}-${seg()}-${seg()}`;
}

async function saveCardToUser(
  userId: string,
  cardCode: string,
  accessToken: string,
) {
  const db = serviceDb();
  const shortCode = generateShortCode();
  const { error } = await db
    .from('users')
    .update({ lkm_card_code: cardCode, lkm_access_token: accessToken, short_code: shortCode })
    .eq('id', userId);
  if (error) throw new Error(`Failed to save card: ${error.message}`);
  return shortCode;
}

// ── Register via phone ────────────────────────────────────────────────────────

async function registerPhone(userId: string, body: Record<string, unknown>) {
  const { name, phone, countryCode = '351', email, password, acceptMarketing = false } = body;

  const payload = {
    Email: email,
    Password: password,
    Nome: name,
    Telemovel: phone,
    IndicativoPais: countryCode,
    ACEITA_COMUNICACOES_COMERCIAIS: acceptMarketing,
    ACEITA_COMUNICACOES_SMS: acceptMarketing,
    ACEITA_COMUNICACOES_EMAIL: acceptMarketing,
    APLICAR_RGPD: true,
  };

  const result = await lkmFetch<{ CodCartao?: string; AccessToken?: string; codCard?: string }>(
    '/v2/AccountWithPhone/RegisterV2',
    { method: 'POST', body: payload },
  );

  const cardCode    = result.CodCartao  ?? result.codCard ?? '';
  const accessToken = result.AccessToken ?? '';

  const shortCode = await saveCardToUser(userId, cardCode, accessToken);
  return { cardCode, shortCode };
}

// ── Register via email ────────────────────────────────────────────────────────

async function registerEmail(userId: string, body: Record<string, unknown>) {
  const { name, email, password, phone = '', acceptMarketing = false } = body;

  const payload = {
    registerBindingModel: {
      Email:    email,
      Password: password,
      Nome:     name,
      Telemovel: phone,
      ACEITA_COMUNICACOES_COMERCIAIS: acceptMarketing,
      ACEITA_COMUNICACOES_EMAIL: acceptMarketing,
      APLICAR_RGPD: true,
    },
    loyaltyClient: {},
  };

  const result = await lkmFetch<{ CodCartao?: string; AccessToken?: string; codCard?: string }>(
    '/v2/Account/Registerv2',
    { method: 'POST', body: payload },
  );

  const cardCode    = result.CodCartao  ?? result.codCard ?? '';
  const accessToken = result.AccessToken ?? '';

  const shortCode = await saveCardToUser(userId, cardCode, accessToken);
  return { cardCode, shortCode };
}

// ── Link existing card by phone or email ──────────────────────────────────────

async function linkCard(userId: string, body: Record<string, unknown>) {
  const { phone, email, countryCode = '351' } = body;

  let result: { CodCartao?: string; AccessToken?: string; codCard?: string } = {};

  if (phone) {
    result = await lkmFetch('/v2/Card/GetCardForPhone', {
      method: 'POST',
      body: { Phone: phone, CountryCode: countryCode },
    });
  } else if (email) {
    result = await lkmFetch('/v2/Card/GetCardForEmail', {
      queryParams: { Email: email },
    });
  } else {
    throw new Error('Provide phone or email to link card');
  }

  const cardCode    = result.CodCartao ?? result.codCard ?? '';
  const accessToken = result.AccessToken ?? '';
  const shortCode   = await saveCardToUser(userId, cardCode, accessToken);
  return { cardCode, shortCode };
}

// ── Get LKM profile for current user ─────────────────────────────────────────

async function getProfile(userId: string) {
  const db = serviceDb();
  const { data, error } = await db
    .from('users')
    .select('lkm_card_code, lkm_access_token, short_code, name, email, phone')
    .eq('id', userId)
    .single();

  if (error || !data?.lkm_card_code) {
    return { linked: false };
  }

  // Fetch fresh data from LKM
  const clientToken = await getClientToken(data.lkm_access_token);
  const profile = await lkmFetch<Record<string, unknown>>('/v2/Account/UserInfoNoLogin', {
    clientToken,
  });

  return {
    linked:     true,
    cardCode:   data.lkm_card_code,
    shortCode:  data.short_code,
    lkmProfile: profile,
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { user } = await getSupabaseUser(req);

    if (req.method === 'GET') {
      const data = await getProfile(user.id);
      return jsonResponse(data, { headers: corsHeaders });
    }

    if (req.method === 'POST') {
      const body: Record<string, unknown> = await req.json();
      const { action, ...rest } = body;

      let result: unknown;
      if (action === 'register-phone') {
        result = await registerPhone(user.id, rest);
      } else if (action === 'register-email') {
        result = await registerEmail(user.id, rest);
      } else if (action === 'link') {
        result = await linkCard(user.id, rest);
      } else {
        return errorResponse('Unknown action. Use register-phone, register-email, or link.');
      }

      return jsonResponse(result, { headers: corsHeaders });
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    if (err instanceof LkmApiError) {
      return errorResponse(err.message, err.status >= 500 ? 502 : err.status);
    }
    console.error('[lkm-account]', err);
    return errorResponse((err as Error).message, 500);
  }
});
