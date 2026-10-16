/** App-issued voucher codes (not LKM / WinRest). */
const APP_VOUCHER_RE = /VD-[A-Z0-9]{4}-[A-Z0-9]{4}/i;

export function extractVoucherCode(raw: string): string {
  const trimmed = raw.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  if (!trimmed) return '';

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (typeof parsed === 'string') return extractVoucherCode(parsed);
    if (parsed && typeof parsed === 'object') {
      const o = parsed as Record<string, unknown>;
      for (const key of [
        'codVoucher',
        'CodVoucher',
        'code',
        'qr',
        'qrValue',
        'value',
        'codCartao',
        'CodCartao',
        'cardCode',
      ]) {
        if (o[key] != null) return extractVoucherCode(String(o[key]));
      }
    }
  } catch {
    // not JSON
  }

  const compact = trimmed.toUpperCase().replace(/\s+/g, '');
  const match = compact.match(APP_VOUCHER_RE);
  if (match) return match[0];
  return compact;
}

export function isAppVoucherCode(code: string): boolean {
  return /^VD-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);
}

export function looksLikeLoyaltyCard(code: string): boolean {
  return /^\d{8,}$/.test(code);
}
