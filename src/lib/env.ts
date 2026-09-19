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

/** Supabase keys/URLs must be plain ASCII. A stray Unicode char (smart quote, or
 *  a UTF-8 BOM added by the hosting provider's env editor) breaks every fetch
 *  with a cryptic error, so invisible characters are stripped before validating. */
function ascii(name: string, value: string): string {
  const clean = value.replace(/[\uFEFF\u200B\u200C\u200D\u2060\u00A0]/g, '').trim();
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
  /**
   * SMTP credentials (SMTP2GO). Ports: 2525 is the SMTP2GO default alternative,
   * 587/8025/80/25 also accept STARTTLS, 465/8465/443 are implicit TLS.
   */
  get smtp() {
    const portRaw = optional('SMTP_PORT', '2525');
    const port = Number.parseInt(portRaw, 10);
    return {
      host: optional('SMTP_HOST'),
      port: Number.isFinite(port) && port > 0 ? port : 2525,
      user: optional('SMTP_USER'),
      pass: optional('SMTP_PASSWORD') || optional('SMTP_PASS'),
      /** Overrides EMAIL_FROM for SMTP only, for when the verified domain differs. */
      from: optional('SMTP_FROM'),
    };
  },
  get emailFrom() {
    return optional('EMAIL_FROM', 'Linux OSS Club <onboarding@resend.dev>');
  },
  /**
   * Optional pin for the first provider to try. Unset means pure round-robin
   * across everything configured.
   */
  get emailPrimary(): 'resend' | 'smtp' | 'brevo' | null {
    const raw = optional('PRIMARY_EMAIL_PROVIDER').toLowerCase();
    if (raw === 'brevo' || raw === 'smtp' || raw === 'resend') return raw;
    return null;
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
