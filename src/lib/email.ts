import { Resend } from 'resend';
import nodemailer, { type Transporter } from 'nodemailer';
import { env } from './env';

interface SendEmailArgs {
  to: string | string[];
  subject: string;
  html: string;
}

export type EmailProvider = 'resend' | 'smtp' | 'brevo';

interface SendResult {
  provider: EmailProvider;
  attempts: Array<{ provider: EmailProvider; error?: string }>;
}

function parseFrom(from: string): { name?: string; email: string } {
  const match = from.match(/^(.*)<([^>]+)>\s*$/);
  if (match) {
    return { name: match[1].trim() || undefined, email: match[2].trim() };
  }
  return { email: from.trim() };
}

/* ------------------------------------------------------------------ Resend */

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

/* -------------------------------------------------------------------- SMTP */

let transporter: Transporter | null = null;

/**
 * SMTP transport, used for SMTP2GO (mail.smtp2go.com:2525, or 587/8025/80/25
 * with STARTTLS, 465/8465/443 with implicit TLS). Credentials come from the
 * environment: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.
 *
 * Reused across invocations because a warm serverless instance can then skip the
 * TLS handshake and AUTH round trip.
 */
function smtpTransport(): Transporter {
  const { host, port, user, pass } = env.smtp;
  if (!host || !user || !pass) {
    throw new Error('SMTP_HOST / SMTP_USER / SMTP_PASS not configured');
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      // 465, 8465 and 443 are implicit TLS; everything else upgrades via STARTTLS.
      secure: port === 465 || port === 8465 || port === 443,
      requireTLS: !(port === 465 || port === 8465 || port === 443),
      auth: { user, pass },
      pool: true,
      maxConnections: 2,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }
  return transporter;
}

async function sendViaSmtp({ to, subject, html }: SendEmailArgs): Promise<void> {
  const info = await smtpTransport().sendMail({
    from: env.smtp.from || env.emailFrom,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
  });
  if (info.rejected && info.rejected.length > 0) {
    throw new Error(`SMTP rejected ${info.rejected.length} recipient(s)`);
  }
}

/** Authenticates against the SMTP server without sending anything. */
export async function verifySmtp(): Promise<true> {
  await smtpTransport().verify();
  return true;
}

/* ------------------------------------------------------------------- Brevo */

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

/* ---------------------------------------------------------------- Dispatch */

const SENDERS: Record<EmailProvider, (args: SendEmailArgs) => Promise<void>> = {
  resend: sendViaResend,
  smtp: sendViaSmtp,
  brevo: sendViaBrevo,
};

function configuredProviders(): EmailProvider[] {
  const list: EmailProvider[] = [];
  if (env.resendApiKey) list.push('resend');
  if (env.smtp.host && env.smtp.user && env.smtp.pass) list.push('smtp');
  if (env.brevoApiKey) list.push('brevo');
  return list;
}

// Module-level cursor: spreads sends across providers instead of hammering one
// until it fails. Per-instance on serverless, which is fine -- the goal is load
// spreading and resilience, not exact fairness.
let cursor = 0;

/**
 * Providers in the order they should be attempted for this send: a round-robin
 * rotation over everything configured, with PRIMARY_EMAIL_PROVIDER (when set and
 * configured) pinned to the front.
 */
export function providerOrder(providers = configuredProviders(), preferred = env.emailPrimary): EmailProvider[] {
  if (providers.length === 0) return [];
  const start = cursor++ % providers.length;
  const rotated = [...providers.slice(start), ...providers.slice(0, start)];
  if (preferred && providers.includes(preferred)) {
    return [preferred, ...rotated.filter((p) => p !== preferred)];
  }
  return rotated;
}

export async function sendEmail({ to, subject, html }: SendEmailArgs): Promise<SendResult> {
  const order = providerOrder();
  if (order.length === 0) {
    throw new Error(
      'No email provider is configured. Set RESEND_API_KEY, SMTP_* (SMTP2GO) or BREVO_API_KEY.'
    );
  }

  const attempts: SendResult['attempts'] = [];
  let lastError: unknown = null;

  for (const provider of order) {
    try {
      await SENDERS[provider]({ to, subject, html });
      attempts.push({ provider });
      return { provider, attempts };
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      attempts.push({ provider, error: message });
      console.error(`Email via ${provider} failed, trying next provider:`, message);
      logActionableHint(provider, err);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`All email providers failed: ${order.join(', ')}`);
}

function logActionableHint(provider: EmailProvider, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  if (provider === 'resend' && /testing emails|verify a domain/i.test(msg)) {
    console.error(
      'HINT: Resend is in test mode (onboarding@resend.dev can only mail the account owner). ' +
        'Verify a domain at resend.com/domains and set EMAIL_FROM to it.'
    );
  }
  if (provider === 'brevo' && /authorised_ips|IP address|unrecognised IP/i.test(msg)) {
    console.error(
      'HINT: Brevo rejected this server IP, which is expected on serverless where the egress IP ' +
        'changes. Authorize the range at app.brevo.com/security/authorised_ips, disable IP ' +
        'restriction for the key, or rely on the SMTP2GO and Resend providers instead.'
    );
  }
  if (provider === 'smtp' && /sender domain not verified|550/i.test(msg)) {
    console.error(
      'HINT: SMTP2GO accepted the login but refuses the From domain. Add it under ' +
        'Sending > Verified Senders in SMTP2GO and publish the CNAME/DKIM records it gives you, ' +
        'or point SMTP_FROM at an address on a domain that is already verified there.'
    );
  }
  if (provider === 'smtp' && /invalid login|535|534|authentication/i.test(msg)) {
    console.error('HINT: SMTP_USER / SMTP_PASSWORD rejected by the SMTP server. Re-check the SMTP2GO user.');
  }
  if (provider === 'smtp' && /timeout|ETIMEDOUT|ECONNREFUSED/i.test(msg)) {
    console.error(
      'HINT: SMTP connection blocked. Try SMTP_PORT=2525 (SMTP2GO alternative) or 587; some hosts ' +
        'block outbound 25.'
    );
  }
}

export function otpEmailHtml(code: string): string {
  return `
    <div style="font-family: monospace; background-color: #0B0E14; color: #F1F5F9; padding: 24px; border-radius: 12px;">
      <h2 style="color: #E11D48;">// Linux OSS Club - Sign in</h2>
      <p>Your one-time passcode is:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${code}</p>
      <p style="color: #94A3B8;">Valid for 10 minutes. Never share this code.</p>
    </div>
  `;
}
