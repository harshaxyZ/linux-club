/**
 * Cleans an environment variable that was pasted through a tool which added
 * invisible characters.
 *
 * This is not hypothetical: the Vercel project had a UTF-8 BOM (U+FEFF) in front
 * of both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, which
 * inlined into the client bundle as "\uFEFFhttps://<ref>.supabase.co". Every
 * Supabase request then went to a malformed URL with a malformed apikey, so
 * Google sign-in failed in production while localhost (clean .env.local) worked.
 *
 * Stripped: BOM, zero-width spaces/joiners, word joiner, non-breaking space, and
 * a surrounding pair of quotes, which is the other common paste mistake.
 */
const INVISIBLE_CHARS = /[\uFEFF\u200B\u200C\u200D\u2060\u00A0]/g;

export function cleanEnvValue(raw: string | undefined | null): string {
  if (!raw) return '';
  let value = raw.replace(INVISIBLE_CHARS, '').trim();
  const quoted =
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"));
  if (quoted && value.length >= 2) value = value.slice(1, -1).trim();
  return value;
}

/** Reads and cleans a public Supabase setting. Returns '' when unusable. */
export function publicSupabaseConfig(): { url: string; anonKey: string } {
  return {
    url: cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}
