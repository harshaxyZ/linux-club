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

export async function isAdmin(email: string | null | undefined, userId?: string): Promise<boolean> {
  if (isEnvAdmin(email)) return true;
  if (!userId) return false;
  try {
    const admin = createAdminClient(env.supabaseUrl, env.serviceRoleKey);
    const { data } = await admin
      .from('admins')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) return true;
    const { data: byEmail } = await admin
      .from('admins')
      .select('id')
      .eq('email', email?.trim().toLowerCase() ?? '')
      .maybeSingle();
    return !!byEmail;
  } catch {
    return false;
  }
}

export function adminClient() {
  return createAdminClient(env.supabaseUrl, env.serviceRoleKey);
}
