import { Resend } from 'resend';
import nodemailer, { type Transporter } from 'nodemailer';
import { env } from './env';

interface SendEmailArgs {
  to: string | string[];
  subject: string;
  html: string;
}

export type ChannelKind = 'resend' | 'smtp' | 'brevo';

export interface Channel {
  /** Stable id used in logs and for pinning, e.g. `resend#2`. */
  id: string;
  kind: ChannelKind;
  send: (args: SendEmailArgs) => Promise<void>;
}

interface SendResult {
  channel: string;
  attempts: Array<{ channel: string; error?: string }>;
}

function parseFrom(from: string): { name?: string; email: string } {
  const match = from.match(/^(.*)<([^>]+)>\s*$/);
  if (match) {
    return { name: match[1].trim() || undefined, email: match[2].trim() };
  }
  return { email: from.trim() };
}

/* ------------------------------------------------------------------ Resend */

/**
 * One channel per API key. Each key usually belongs to a different Resend
 * account with a different verified domain, so a per-key From can be supplied
 * through RESEND_FROMS (positional, falling back to EMAIL_FROM).
 */
function resendChannels(): Channel[] {
  const keys = env.resendApiKeys;
  const froms = env.resendFroms;
  return keys.map((key, index) => ({
    id: keys.length > 1 ? `resend#${index + 1}` : 'resend',
    kind: 'resend' as const,
    async send({ to, subject, html }: SendEmailArgs) {
      const from = froms[index] || env.emailFrom;
      const { error } = await new Resend(key).emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      });
      if (error) throw new Error(error.message);
    },
  }));
}

/* -------------------------------------------------------------------- SMTP */

let transporter: Transporter | null = null;

/**
 * SMTP transport, used for SMTP2GO (mail.smtp2go.com:2525, or 587/8025/80/25
 * with STARTTLS, 465/8465/443 with implicit TLS). Reused across invocations so a
 * warm serverless instance skips the TLS handshake and AUTH round trip.
 */
function smtpTransport(): Transporter {
  const { host, port, user, pass } = env.smtp;
  if (!host || !user || !pass) {
    throw new Error('SMTP_HOST / SMTP_USER / SMTP_PASSWORD not configured');
  }
  if (!transporter) {
    const implicitTls = port === 465 || port === 8465 || port === 443;
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: implicitTls,
      requireTLS: !implicitTls,
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

function smtpChannel(): Channel[] {
  const { host, user, pass } = env.smtp;
  if (!host || !user || !pass) return [];
  return [
    {
      id: 'smtp',
      kind: 'smtp',
      async send({ to, subject, html }: SendEmailArgs) {
        const info = await smtpTransport().sendMail({
          from: env.smtp.from || env.emailFrom,
          to: Array.isArray(to) ? to.join(', ') : to,
          subject,
          html,
        });
        if (info.rejected && info.rejected.length > 0) {
          throw new Error(`SMTP rejected ${info.rejected.length} recipient(s)`);
        }
      },
    },
  ];
}

/** Authenticates against the SMTP server without sending anything. */
export async function verifySmtp(): Promise<true> {
  await smtpTransport().verify();
  return true;
}

/* ------------------------------------------------------------------- Brevo */

function brevoChannel(): Channel[] {
  const apiKey = env.brevoApiKey;
  if (!apiKey) return [];
  return [
    {
      id: 'brevo',
      kind: 'brevo',
      async send({ to, subject, html }: SendEmailArgs) {
        const recipients = (Array.isArray(to) ? to : [to]).map((email) => ({ email }));
        const senderEmail = env.brevoSenderEmail;
        const from = senderEmail.includes('@') ? parseFrom(senderEmail) : parseFrom(env.emailFrom);

        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
          body: JSON.stringify({ sender: from, to: recipients, subject, htmlContent: html }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Brevo send failed (${res.status}): ${text.slice(0, 300)}`);
        }
      },
    },
  ];
}

/* ---------------------------------------------------------------- Dispatch */

export function emailChannels(): Channel[] {
  return [...resendChannels(), ...smtpChannel(), ...brevoChannel()];
}

// Module-level cursor: spreads sends across channels instead of hammering one
// until it fails. Per-instance on serverless, which is fine -- the goal is load
// spreading and resilience, not exact fairness.
let cursor = 0;

/**
 * Channels in the order to try for this send: a round-robin rotation over
 * everything configured, with PRIMARY_EMAIL_PROVIDER (a kind, or an exact channel
 * id) pinned to the front when it exists.
 */
export function channelOrder(channels = emailChannels(), preferred = env.emailPrimary): Channel[] {
  if (channels.length === 0) return [];
  const start = cursor++ % channels.length;
  const rotated = [...channels.slice(start), ...channels.slice(0, start)];
  if (!preferred) return rotated;
  const pinned = rotated.filter((c) => c.id === preferred || c.kind === preferred);
  if (pinned.length === 0) return rotated;
  return [...pinned, ...rotated.filter((c) => !pinned.includes(c))];
}

export async function sendEmail({ to, subject, html }: SendEmailArgs): Promise<SendResult> {
  const order = channelOrder();
  if (order.length === 0) {
    throw new Error(
      'No email provider is configured. Set RESEND_API_KEY(S), SMTP_* (SMTP2GO) or BREVO_API_KEY.'
    );
  }

  const attempts: SendResult['attempts'] = [];
  let lastError: unknown = null;

  for (const channel of order) {
    try {
      await channel.send({ to, subject, html });
      attempts.push({ channel: channel.id });
      return { channel: channel.id, attempts };
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      attempts.push({ channel: channel.id, error: message });
      console.error(`Email via ${channel.id} failed, trying next channel:`, message);
      logActionableHint(channel.kind, err);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`All email channels failed: ${order.map((c) => c.id).join(', ')}`);
}

function logActionableHint(kind: ChannelKind, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  if (kind === 'resend' && /testing emails|verify a domain|not verified/i.test(msg)) {
    console.error(
      'HINT: this Resend key can only mail its own account owner until a domain is verified. ' +
        'Verify the domain at resend.com/domains, then make sure the matching entry in RESEND_FROMS ' +
        '(or EMAIL_FROM) uses that domain.'
    );
  }
  if (kind === 'resend' && /API key is invalid|unauthorized|401/i.test(msg)) {
    console.error('HINT: a Resend key in RESEND_API_KEYS is invalid or revoked. Rotate it and update the env var.');
  }
  if (kind === 'brevo' && /authorised_ips|IP address|unrecognised IP/i.test(msg)) {
    console.error(
      'HINT: Brevo rejected this server IP, which is expected on serverless where the egress IP ' +
        'changes. Authorize the range at app.brevo.com/security/authorised_ips, disable IP ' +
        'restriction for the key, or rely on the other channels.'
    );
  }
  if (kind === 'smtp' && /sender domain not verified|550/i.test(msg)) {
    console.error(
      'HINT: SMTP2GO accepted the login but refuses the From domain. Add it under ' +
        'Sending > Verified Senders in SMTP2GO and publish the CNAME/DKIM records it gives you, ' +
        'or point SMTP_FROM at an address on a domain that is already verified there.'
    );
  }
  if (kind === 'smtp' && /invalid login|535|534|authentication/i.test(msg)) {
    console.error('HINT: SMTP_USER / SMTP_PASSWORD rejected by the SMTP server. Re-check the SMTP2GO user.');
  }
  if (kind === 'smtp' && /timeout|ETIMEDOUT|ECONNREFUSED/i.test(msg)) {
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
