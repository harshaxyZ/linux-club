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

/** Supabase keys/URLs must be plain ASCII — a stray Unicode char (smart quote,
 *  zero-width space from copy-paste) breaks every fetch with a cryptic error. */
function ascii(name: string, value: string): string {
  const clean = value.trim();
  const badAt = [...clean].findIndex((ch) => ch.codePointAt(0)! > 0xff);
  if (badAt !== -1) {
    throw new Error(
      `${name} contains a non-ASCII character at position ${badAt} (U+${clean
        .codePointAt(badAt)!
        .toString(16).toUpperCase()}). Re-paste it as plain text.`
    );
  }
  return clean;
}

export const env = {
  get supabaseUrl() {
    return ascii('NEXT_PUBLIC_SUPABASE_URL', required('NEXT_PUBLIC_SUPABASE_URL'));
  },
  get supabaseAnonKey() {
    return ascii('NEXT_PUBLIC_SUPABASE_ANON_KEY', required('NEXT_PUBLIC_SUPABASE_ANON_KEY'));
  },
  get serviceRoleKey() {
    return ascii('SUPABASE_SERVICE_ROLE_KEY', required('SUPABASE_SERVICE_ROLE_KEY'));
  },
  get resendApiKey() {
    return optional('RESEND_API_KEY');
  },
  get brevoApiKey() {
    return optional('BREVO_API_KEY');
  },
  get brevoSenderEmail() {
    return optional('BREVO_SENDER_EMAIL', this.emailFrom);
  },
  get emailFrom() {
    return optional('EMAIL_FROM', 'Linux OSS Club <onboarding@resend.dev>');
  },
  /** Which provider to try first. Use `brevo` while Resend is in test mode. */
  get emailPrimary(): 'resend' | 'brevo' {
    return optional('PRIMARY_EMAIL_PROVIDER', 'resend').toLowerCase() === 'brevo' ? 'brevo' : 'resend';
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
