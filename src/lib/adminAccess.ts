/** Canonical admin login — shown even if profile fetch is slow/stale. */
export const ADMIN_EMAILS = ['admin@chefdomingos.app'] as const;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (ADMIN_EMAILS as readonly string[]).includes(normalized);
}

export function hasAdminAccess(opts: {
  email?: string | null;
  isAdminFlag?: boolean | null;
  appMetadata?: Record<string, unknown> | null;
}): boolean {
  if (opts.isAdminFlag === true) return true;
  if (opts.appMetadata?.is_admin === true) return true;
  if (isAdminEmail(opts.email)) return true;
  return false;
}
