import { createBrowserClient } from '@supabase/ssr';
import { publicSupabaseConfig } from '../env-value';

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (supabaseClient) return supabaseClient;

  // Values are cleaned because a BOM or zero-width character pasted into the
  // hosting provider's env settings is inlined verbatim into this bundle and
  // makes every auth request fail with an unhelpful error.
  const { url, anonKey } = publicSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  supabaseClient = createBrowserClient(url, anonKey);
  return supabaseClient;
}
