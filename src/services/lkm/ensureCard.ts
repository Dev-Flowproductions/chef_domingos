import { getLkmProfile, type LkmProfile } from './auth';
import { lkmCall } from './client';

/**
 * Ensures the logged-in user has an LKM card linked (lookup or register via email).
 */
export async function ensureLkmCardLinked(opts?: {
  name?: string;
  password?: string;
}): Promise<LkmProfile> {
  try {
    const profile = await getLkmProfile();
    if (profile.linked && profile.cardCode) return profile;

    const ensured = await lkmCall<LkmProfile>('lkm-account', {
      method: 'POST',
      body: { action: 'ensure', ...opts },
    });
    if (ensured.linked && ensured.cardCode) return ensured;

    // Log the exact LKM error so we can diagnose it
    console.warn('[ensureLkmCardLinked] not linked. LKM error:', ensured.errorMessage ?? '(no error message)');
    console.warn('[ensureLkmCardLinked] full response:', JSON.stringify(ensured));

    return {
      linked: false,
      needsRegistration: ensured.needsRegistration ?? true,
      errorMessage: ensured.errorMessage,
    };
  } catch (err) {
    const message = (err as Error).message;
    console.warn('[ensureLkmCardLinked] failed:', message);
    return {
      linked: false,
      needsRegistration: true,
      errorMessage: message,
    };
  }
}
