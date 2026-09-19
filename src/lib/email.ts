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
  const resendKey = env.resendApiKey;

  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      const { error } = await resend.emails.send({
        from: env.emailFrom,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      });
      if (error) throw new Error(error.message);
      return { provider: 'resend' };
    } catch (err) {
      console.error('Resend send failed, falling back to Brevo:', err);
    }
  }

  await sendViaBrevo({ to, subject, html });
  return { provider: 'brevo' };
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
