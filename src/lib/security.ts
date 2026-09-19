export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip') || 'unknown';
}

export function escapeHtml(input: unknown): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim()) && email.length <= 254;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Reduces anything a student might type or paste to bare mobile digits.
 *
 * Handles the common shapes: "+91 98765 43210", "091-98765-43210",
 * "(987) 654-3210". A leading country code or trunk zero is dropped rather than
 * the number being truncated from the wrong end, then the first 10 digits win so
 * typing an extra digit is ignored instead of silently shifting the number.
 */
export function toMobileDigits(raw: string): string {
  let digits = String(raw ?? '').replace(/\D/g, '');
  // Leading zeros are never significant in an Indian mobile number (they start
  // 6-9), so drop trunk and 00-style international prefixes first.
  digits = digits.replace(/^0+/, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  return digits.slice(0, 10);
}

export function normalizePhone(phone: string): string {
  return toMobileDigits(phone);
}

export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}

export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Makes a user string safe to interpolate into a PostgREST `or(...)` filter.
 *
 * `or()` takes a comma-separated list of `column.op.value` triples, so a comma,
 * parenthesis or quote in the value injects extra filter terms. Only characters
 * that are meaningful in a name/USN/email search are kept; `%` and `_` are
 * dropped so the value cannot turn into an ILIKE wildcard either.
 */
export function sanitizeFilterValue(input: string, maxLength = 80): string {
  return input
    .replace(/[^A-Za-z0-9 @.\-+]/g, '')
    .trim()
    .slice(0, maxLength);
}
