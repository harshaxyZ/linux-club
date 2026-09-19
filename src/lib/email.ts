import { Resend } from 'resend';
import { env } from './env';

interface SendEmailArgs {
  to: string | string[];
  subject: string;
  html: string;
}

async function sendViaBrevo({ to, subject, html }: SendEmailArgs): Promise<void> {
  const apiKey = env.brevoApiKey;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');

  const recipients = (Array.isArray(to) ? to : [to]).map((email) => ({ email }));
  const senderEmail = env.brevoSenderEmail;
  const from = senderEmail.includes('@') ? parseFrom(senderEmail) : parseFrom(env.emailFrom);

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: from,
      to: recipients,
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Brevo send failed (${res.status}): ${text.slice(0, 300)}`);
  }
}

function parseFrom(from: string): { name?: string; email: string } {
  const match = from.match(/^(.*)<([^>]+)>\s*$/);
  if (match) {
    return { name: match[1].trim() || undefined, email: match[2].trim() };
  }
  return { email: from.trim() };
}

export async function sendEmail({ to, subject, html }: SendEmailArgs): Promise<{ provider: 'resend' | 'brevo' }> {
  const order: Array<'resend' | 'brevo'> =
    env.emailPrimary === 'brevo' ? ['brevo', 'resend'] : ['resend', 'brevo'];
  let lastError: unknown = null;

  for (const provider of order) {
    try {
      if (provider === 'resend') {
        await sendViaResend({ to, subject, html });
      } else {
        await sendViaBrevo({ to, subject, html });
      }
      return { provider };
    } catch (err) {
      lastError = err;
      console.error(`Email via ${provider} failed, trying fallback:`, err);
      logActionableHint(provider, err);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('All email providers failed');
}

function logActionableHint(provider: 'resend' | 'brevo', err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  if (provider === 'resend' && /testing emails|verify a domain/i.test(msg)) {
    console.error(
      'HINT: Resend is in test mode (onboarding@resend.dev can only mail the account owner). ' +
        'Verify a domain at resend.com/domains and set EMAIL_FROM to it, or set PRIMARY_EMAIL_PROVIDER=brevo.'
    );
  }
  if (provider === 'brevo' && /authorised_ips|IP address/i.test(msg)) {
    console.error(
      'HINT: Brevo rejected this server IP. Authorize it at app.brevo.com/security/authorised_ips ' +
        'or disable IP restriction for the API key.'
    );
  }
}

async function sendViaResend({ to, subject, html }: SendEmailArgs): Promise<void> {
  const resendKey = env.resendApiKey;
  if (!resendKey) throw new Error('RESEND_API_KEY not configured');
  const resend = new Resend(resendKey);
  const { error } = await resend.emails.send({
    from: env.emailFrom,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });
  if (error) throw new Error(error.message);
}

export function otpEmailHtml(code: string): string {
  return `
    <div style="font-family: monospace; background-color: #0B0E14; color: #F1F5F9; padding: 24px; border-radius: 12px;">
      <h2 style="color: #E11D48;">// Linux OSS Club — Sign in</h2>
      <p>Your one-time passcode is:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${code}</p>
      <p style="color: #94A3B8;">Valid for 10 minutes. Never share this code.</p>
    </div>
  `;
}
