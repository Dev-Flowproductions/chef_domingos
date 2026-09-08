// delete-account Edge Function
// POST /delete-account — permanently deletes the authenticated user's data + auth user
// Required for Apple App Store Guideline 5.1.1(v) account deletion.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY')!;

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return errorResponse('Missing Authorization header', 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return errorResponse('Invalid or expired session', 401);
    }

    const userId = userData.user.id;
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE);

    await db.from('vouchers').delete().eq('user_id', userId);
    await db.from('loyalty_transactions').delete().eq('user_id', userId);
    await db.from('points_reversals').delete().eq('user_id', userId);
    await db.from('users').delete().eq('id', userId);

    const { error } = await db.auth.admin.deleteUser(userId);
    if (error) {
      console.error('[delete-account] auth.admin.deleteUser failed:', error.message);
      throw new Error(`Failed to delete account: ${error.message}`);
    }

    return jsonResponse({ deleted: true });
  } catch (err) {
    const message = (err as Error).message ?? 'Account deletion failed';
    console.error('[delete-account]', message);
    return errorResponse(message, 400);
  }
});
