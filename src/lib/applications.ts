import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Finds the caller's application by user_id, then by verified email.
 *
 * `email` has no unique constraint in the initial schema, so `.maybeSingle()`
 * used to throw (and surface as a 500) whenever two rows shared an address.
 * Ordering by created_at with limit(1) keeps the newest row and cannot fail.
 */
export async function findApplicationFor<T extends Record<string, unknown> = Record<string, unknown>>(
  supabase: SupabaseClient,
  userId: string,
  verifiedEmail: string,
  columns = '*'
): Promise<(T & { id: string }) | null> {
  const byUser = await supabase
    .from('applications')
    .select(columns)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (byUser.error) throw new Error(byUser.error.message);
  if (byUser.data && byUser.data.length > 0) {
    return byUser.data[0] as unknown as T & { id: string };
  }

  if (!verifiedEmail) return null;

  const byEmail = await supabase
    .from('applications')
    .select(columns)
    .eq('email', verifiedEmail)
    .order('created_at', { ascending: false })
    .limit(1);
  if (byEmail.error) throw new Error(byEmail.error.message);
  if (byEmail.data && byEmail.data.length > 0) {
    return byEmail.data[0] as unknown as T & { id: string };
  }
  return null;
}
