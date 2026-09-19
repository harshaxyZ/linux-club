import { NextRequest, NextResponse } from 'next/server';
import { adminClient, getSessionUser, isAdmin } from '@/lib/auth';
import { env } from '@/lib/env';
import { emailChannels, sendEmail } from '@/lib/email';
import { emailLayout, emailMuted, emailParagraph } from '@/lib/email-template';
import { escapeHtml, getClientIp, isValidEmail, normalizeEmail } from '@/lib/security';
import { rateLimitAll } from '@/lib/rate-limit';
import { resolveDeviceId } from '@/lib/device';
import { crossOriginDenied, isSameOrigin } from '@/lib/request';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return crossOriginDenied();

  const user = await getSessionUser();
  if (!user || !(await isAdmin(user.email, user.id))) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403, headers: NO_STORE });
  }

  const ip = getClientIp(req.headers);
  const deviceId = resolveDeviceId(req.headers, req.cookies);
  const allowed = await rateLimitAll([
    { key: `invite:user:${user.id}`, limit: 10, windowMs: 60 * 60 * 1000 },
    { key: `invite:ip:${ip}`, limit: 20, windowMs: 60 * 60 * 1000 },
    deviceId ? { key: `invite:device:${deviceId}`, limit: 10, windowMs: 60 * 60 * 1000 } : null,
  ]);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many invites. Try later.' }, { status: 429, headers: NO_STORE });
  }

  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(String(body.email ?? ''));
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Valid email required.' }, { status: 400, headers: NO_STORE });
  }

  const supabase = adminClient();

  // Grant access first. This used to only send an email and write an
  // admin_invitations row, so the invitee was never actually an admin and hit
  // "Access denied" on sign-in: isAdmin() looks at ADMIN_EMAILS and public.admins,
  // neither of which the old flow touched.
  const { data: inviter } = await supabase
    .from('admins')
    .select('id')
    .eq('email', (user.email ?? '').trim().toLowerCase())
    .maybeSingle();

  const { error: grantError } = await supabase
    .from('admins')
    .upsert({ email, invited_by: inviter?.id ?? null }, { onConflict: 'email' });

  if (grantError) {
    console.error('Granting reviewer access failed:', grantError.message);
    return NextResponse.json(
      { error: 'Could not grant reviewer access. Check that the admins table exists.' },
      { status: 500, headers: NO_STORE }
    );
  }

  // Best-effort audit trail; requires the inviter to exist in admins.
  if (inviter) {
    try {
      await supabase.from('admin_invitations').insert({
        email,
        token: crypto.randomUUID(),
        invited_by: inviter.id,
        expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      });
    } catch {
      // The grant above is what matters.
    }
  }

  const e = escapeHtml;
  const html = emailLayout({
    title: 'You now have reviewer access',
    preheader: 'Your address was added to the OSSC admin console.',
    bodyHtml: [
      emailParagraph(`${e(user.email ?? 'A club organiser')} added <strong>${e(email)}</strong> to the OSSC admin console.`),
      emailParagraph('Sign in with Google or an email code using this exact address. Any other address will be refused.'),
      emailMuted('Applicant records are personal data. Please do not export or share them outside the core team.'),
    ].join(''),
    cta: { label: 'Open the console', url: `${env.appUrl}/admin` },
    note: 'If you were not expecting this, tell the person above: access can be removed at any time.',
  });

  try {
    const result = await sendEmail({
      to: email,
      subject: 'Reviewer access - OpenSource Students Club',
      html,
    });
    console.log(`Invite delivered by ${result.channel}`);
    return NextResponse.json({ success: true, emailDelivered: true }, { headers: NO_STORE });
  } catch (err) {
    // Access was already granted, so this is a notification failure, not a
    // failed invite. Say so instead of implying nothing happened.
    const message = err instanceof Error ? err.message : String(err);
    console.error('Invite email failed on every channel:', message);
    const configured = emailChannels().map((c) => c.id);
    return NextResponse.json(
      {
        success: true,
        emailDelivered: false,
        warning:
          configured.length === 0
            ? `${email} now has reviewer access, but no email provider is configured on this deployment, so no notification was sent.`
            : `${email} now has reviewer access, but the notification email failed on every channel (${configured.join(', ')}). Last error: ${message.slice(0, 160)}`,
      },
      { headers: NO_STORE }
    );
  }
}
