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

/**
 * Finds an application belonging to someone else that reuses an identifier.
 *
 * A student who applies, then signs in with a second email and submits the same
 * USN or mobile number, is applying twice. This is what catches that. It is
 * deliberately a refusal rather than a merge: a USN is printed on every
 * assignment and is not proof of identity, so adopting a row on the strength of
 * one would let anybody claim another student's application.
 */
export async function findDuplicateApplicant(
  supabase: SupabaseClient,
  { usn, phone, excludeId }: { usn: string; phone: string; excludeId: string | null }
): Promise<{ field: 'usn' | 'phone'; email: string } | null> {
  const checks: Array<{ field: 'usn' | 'phone'; column: string; value: string }> = [
    { field: 'usn', column: 'usn', value: usn },
    { field: 'phone', column: 'phone', value: phone },
  ];

  for (const check of checks) {
    if (!check.value) continue;
    let query = supabase.from('applications').select('id,email').eq(check.column, check.value).limit(1);
    if (excludeId) query = query.neq('id', excludeId);
    const { data, error } = await query;
    if (error) {
      console.error(`Duplicate check on ${check.field} failed:`, error.message);
      continue;
    }
    if (data && data.length > 0) {
      return { field: check.field, email: (data[0] as { email?: string }).email ?? '' };
    }
  }
  return null;
}

/** `mithun@gmail.com` becomes `mi****@gmail.com`: recognisable, not disclosed. */
export function maskEmail(email: string): string {
  const [local, domain] = String(email ?? '').split('@');
  if (!local || !domain) return 'another account';
  const head = local.slice(0, Math.min(2, local.length));
  return `${head}${'*'.repeat(Math.max(3, local.length - head.length))}@${domain}`;
}
