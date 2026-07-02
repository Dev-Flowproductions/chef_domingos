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
  LKM_GRUPO_DESCONTO,
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
      GrupoDesconto: LKM_GRUPO_DESCONTO || undefined,
      ACEITA_POLITICA_PRIVACIDADE: acceptMarketing,
      ACEITA_TELEFONE_PRIVACIDADE: false,
      ACEITA_SMS_PRIVACIDADE: acceptMarketing,
      ACEITA_EMAIL_PRIVACIDADE: acceptMarketing,
      ACEITA_POSTAL_PRIVACIDADE: false,
      ACEITA_POLITICA_MARKETING: acceptMarketing,
      ACEITA_TELEFONE_MARKETING: false,
      ACEITA_SMS_MARKETING: false,
      ACEITA_POSTAL_MARKETING: false,
      ACEITA_EMAIL_MARKETING: acceptMarketing,
      APLICAR_RGPD: true,
    },
  };

  const result = await lkmFetch<Record<string, unknown>>(
    '/v2/Account/Registerv2',
    { method: 'POST', body: payload },
  );

  console.log('[lkm-account] registerEmail raw response:', JSON.stringify(result));

  // Registerv2 returns an array of {Key, Value} pairs: [{Key:"LKA_CLIENTES",Value:{COD_CARTAO,...}}]
  // Fall back to direct object fields for other LKM environments.
  let cardCode    = '';
  let accessToken = '';

  if (Array.isArray(result)) {
    const lkaEntry = (result as Array<Record<string, unknown>>).find(
      (r) => r.Key === 'LKA_CLIENTES',
    );
    const val = lkaEntry?.Value as Record<string, unknown> | undefined;
    cardCode    = String(val?.COD_CARTAO ?? val?.CodCartao ?? val?.codCartao ?? '');
    accessToken = String(val?.AccessToken ?? val?.accessToken ?? '');
  } else {
    cardCode    = String(result.COD_CARTAO ?? result.CodCartao ?? result.codCard ?? result.CardCode ?? result.cardCode ?? '');
    accessToken = String(result.AccessToken ?? result.accessToken ?? '');
  }

  if (!cardCode) throw new Error(`Registerv2 returned no card code. Response: ${JSON.stringify(result)}`);

  const shortCode = await saveCardToUser(userId, cardCode, accessToken);
  return { cardCode, shortCode };
}

// ── Login to LKM with email+password ─────────────────────────────────────────

async function userLogin(userId: string, email: string, password: string) {
  const result = await lkmFetch<Record<string, unknown>>(
    '/v2/Account/UserLogin',
    { queryParams: { clientUser: email, password } },
  );
  console.log('[lkm-account] UserLogin raw response:', JSON.stringify(result));
  // LKM returns COD_CARTAO (uppercase) not CodCartao
  const cardCode = String(
    result.COD_CARTAO ?? result.CodCartao ?? result.codCard ?? result.CardCode ?? result.cardCode ?? '',
  );
  const accessToken = String(result.AccessToken ?? result.accessToken ?? '');
  if (!cardCode) throw new Error(`UserLogin returned no card code. Keys: ${Object.keys(result).join(',')}`);
  const shortCode = await saveCardToUser(userId, cardCode, accessToken);
  return { cardCode, shortCode };
}

// ── Link existing card by phone or email ──────────────────────────────────────

async function linkCard(userId: string, body: Record<string, unknown>) {
  const { phone, email, countryCode = '351' } = body;

  let result: unknown = {};

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

  console.log('[lkm-account] linkCard raw response:', JSON.stringify(result));

  // GetCardForEmail/GetCardForPhone return the card code as a bare JSON string
  // (e.g. "1119000000001"), not an object — this endpoint carries no AccessToken.
  let cardCode = '';
  let accessToken = '';

  if (typeof result === 'string') {
    cardCode = result.trim();
  } else if (result && typeof result === 'object') {
    const r = result as Record<string, unknown>;
    cardCode    = String(r.COD_CARTAO ?? r.CodCartao ?? r.codCard ?? r.CardCode ?? r.cardCode ?? '');
    accessToken = String(r.AccessToken ?? r.accessToken ?? '');
  }

  if (!cardCode) throw new Error(`GetCardForEmail returned no card code. Response: ${JSON.stringify(result)}`);
  const shortCode = await saveCardToUser(userId, cardCode, accessToken);
  return { cardCode, shortCode };
}

// ── Ensure card is linked (lookup by Supabase auth email) ─────────────────────

async function ensureLinked(userId: string, email?: string, name?: string, password?: string) {
  const existing = await getProfile(userId);
  if (existing.linked) return existing;

  if (!email) {
    return { linked: false, needsRegistration: true };
  }

  // 1. Try login with email+password (works for existing accounts, even inactive cards)
  if (password) {
    try {
      await userLogin(userId, email, password);
      const profile = await getProfile(userId);
      if (profile.linked) return profile;
    } catch (loginErr) {
      console.warn('[lkm-account] UserLogin failed:', (loginErr as Error).message);
    }
  }

  // 2. Try to find existing card by email (no password needed)
  let linkErrMessage: string | undefined;
  try {
    await linkCard(userId, { email });
    const profile = await getProfile(userId);
    if (profile.linked) return profile;
  } catch (linkErr) {
    linkErrMessage = (linkErr as Error).message;
    console.warn('[lkm-account] GetCardForEmail failed:', linkErrMessage);
  }

  // 3. Register a new card (only if we have credentials)
  if (password && name) {
    try {
      await registerEmail(userId, { name, email, password });
      const profile = await getProfile(userId);
      if (profile.linked) return profile;
    } catch (regErr) {
      console.warn('[lkm-account] registerEmail failed:', (regErr as Error).message);
      return {
        linked: false,
        needsRegistration: true,
        errorMessage: (regErr as Error).message,
      };
    }
  }

  // No password available to retry login/registration — surface why linking failed.
  return {
    linked: false,
    needsRegistration: true,
    errorMessage:
      linkErrMessage ??
      'No LKM card found for this email and no password available to register one. Please sign out and sign in again with your email and password.',
  };
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
    return { linked: false, needsRegistration: true };
  }

  const base = {
    linked:    true,
    cardCode:  data.lkm_card_code,
    shortCode: data.short_code,
  };

  // LKM refresh is best-effort — QR still works from DB card code if LKM is unreachable.
  try {
    const clientToken = await getClientToken(data.lkm_access_token);
    const profile = await lkmFetch<Record<string, unknown>>('/v2/Account/UserInfoNoLogin', {
      clientToken,
    });
    return { ...base, lkmProfile: profile };
  } catch (err) {
    console.warn('[lkm-account] LKM profile refresh failed:', (err as Error).message);
    return base;
  }
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
      } else if (action === 'ensure') {
        const displayName =
          (rest.name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          user.email?.split('@')[0] ||
          'Cliente';
        result = await ensureLinked(
          user.id,
          user.email,
          displayName,
          rest.password as string | undefined,
        );
      } else {
        return errorResponse('Unknown action. Use register-phone, register-email, link, or ensure.');
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
