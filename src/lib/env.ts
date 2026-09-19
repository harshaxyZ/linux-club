function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

function optional(name: string, fallback = ''): string {
  const v = process.env[name];
  if (!v || v.trim() === '') return fallback;
  return v;
}

export const env = {
  get supabaseUrl() {
    return required('NEXT_PUBLIC_SUPABASE_URL');
  },
  get supabaseAnonKey() {
    return required('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  },
  get serviceRoleKey() {
    return required('SUPABASE_SERVICE_ROLE_KEY');
  },
  get resendApiKey() {
    return optional('RESEND_API_KEY');
  },
  get brevoApiKey() {
    return optional('BREVO_API_KEY');
  },
  get emailFrom() {
    return optional('EMAIL_FROM', 'Linux OSS Club <onboarding@resend.dev>');
  },
  get appUrl() {
    return optional('NEXT_PUBLIC_APP_URL', 'https://webuildnow.in');
  },
  get adminEmails(): string[] {
    const raw =
      optional('ADMIN_EMAILS') ||
      optional('ADMIN_EMAIL');
    return raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  },
};

export function getSiteUrl(requestOrigin?: string): string {
  if (requestOrigin) return requestOrigin;
  return env.appUrl;
}
