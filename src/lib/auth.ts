import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { env } from './env';

export async function getSessionUser() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export function isEnvAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return env.adminEmails.includes(email.trim().toLowerCase());
}

/** Email-only admin check: ADMIN_EMAILS plus rows in public.admins. */
export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (isEnvAdmin(normalized)) return true;
  try {
    const { data } = await adminClient()
      .from('admins')
      .select('id')
      .eq('email', normalized)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export async function isAdmin(email: string | null | undefined, userId?: string): Promise<boolean> {
  if (isEnvAdmin(email)) return true;
  try {
    const admin = adminClient();
    if (userId) {
      const { data } = await admin
        .from('admins')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) return true;
    }
    if (!email) return false;
    const { data: byEmail } = await admin
      .from('admins')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();
    return !!byEmail;
  } catch {
    return false;
  }
}

/**
 * Service-role client. It bypasses RLS, so every caller must do its own
 * authorization check first. Sessions are never persisted or refreshed: this
 * client is request-scoped.
 */
export function adminClient() {
  return createAdminClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
