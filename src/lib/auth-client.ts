import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Client-side fallback for the OAuth code exchange.
 * If the server-side exchange in /auth/callback failed (e.g. PKCE verifier
 * cookie unreadable server-side), the browser client still holds the verifier
 * and can complete the exchange itself — provided the code wasn't consumed.
 * Returns an error message, or null on success.
 */
export async function exchangeCodeOnClient(
  supabase: SupabaseClient,
  code: string
): Promise<string | null> {
  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error ? error.message : null;
  } catch (err) {
    return err instanceof Error ? err.message : 'exchange failed';
  }
}
