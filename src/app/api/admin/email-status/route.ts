import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { emailChannels, verifySmtp } from '@/lib/email';
import { env } from '@/lib/env';

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' } as const;

/** Domain only: enough to spot a wrong or unverified sender, no address leaked. */
function senderDomain(from: string): string {
  const match = from.match(/@([^>\s]+)/);
  return match ? `@${match[1]}` : '(unparseable)';
}

/**
 * Why an invite or sign-in code failed to send, without exposing any credential.
 *
 * A 502 from /api/admin/invite means every channel refused the message, which is
 * almost always provider-side configuration: an unverified sender domain, an
 * IP-restricted key, or missing environment variables on this deployment.
 *
 * GET /api/admin/email-status           -> configuration snapshot
 * GET /api/admin/email-status?verify=1  -> additionally authenticates to SMTP
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !(await isAdmin(user.email, user.id))) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403, headers: NO_STORE });
  }

  const channels = emailChannels();
  const resendKeys = env.resendApiKeys.length;
  const resendFroms = env.resendFroms;

  let smtpCheck: { attempted: boolean; ok?: boolean; error?: string } = { attempted: false };
  if (req.nextUrl.searchParams.get('verify') === '1' && env.smtp.host) {
    try {
      await verifySmtp();
      smtpCheck = { attempted: true, ok: true };
    } catch (err) {
      smtpCheck = {
        attempted: true,
        ok: false,
        error: (err instanceof Error ? err.message : String(err)).slice(0, 200),
      };
    }
  }

  return NextResponse.json(
    {
      channels: channels.map((c) => c.id),
      channelCount: channels.length,
      defaultSenderDomain: senderDomain(env.emailFrom),
      resend: {
        keys: resendKeys,
        senderDomains: resendFroms.map(senderDomain),
      },
      smtp: {
        configured: Boolean(env.smtp.host && env.smtp.user && env.smtp.pass),
        host: env.smtp.host || null,
        port: env.smtp.port,
        senderDomain: env.smtp.from ? senderDomain(env.smtp.from) : senderDomain(env.emailFrom),
        auth: smtpCheck,
      },
      brevo: {
        configured: Boolean(env.brevoApiKey),
        senderDomain: env.brevoApiKey ? senderDomain(env.brevoSenderEmail) : null,
      },
      pinnedFirst: env.emailPrimary,
      appUrl: env.appUrl,
      hint:
        channels.length === 0
          ? 'No channel is configured on this deployment. Set RESEND_API_KEYS, SMTP_* or BREVO_API_KEY in the hosting environment.'
          : 'A 502 on invite means every channel above refused the message. Check the deployment logs for the per-channel reason, usually an unverified sender domain.',
    },
    { headers: NO_STORE }
  );
}
