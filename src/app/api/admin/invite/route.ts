import { NextRequest, NextResponse } from 'next/server';
import { adminClient, getSessionUser, isAdmin } from '@/lib/auth';
import { env } from '@/lib/env';
import { sendEmail } from '@/lib/email';
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

  const e = escapeHtml;
  try {
    await sendEmail({
      to: email,
      subject: 'Admin invitation - Linux OpenSource Club',
      html: `
        <div style="font-family: monospace; background:#0B0E14; color:#F1F5F9; padding:24px; border-radius:12px;">
          <h2 style="color:#E11D48;">Admin invitation</h2>
          <p>${e(user.email ?? 'An admin')} invited you (${e(email)}) to the Linux OpenSource Club admin console.</p>
          <p>Sign in with Google or an email code using this exact address:</p>
          <p><a href="${e(env.appUrl)}/admin" style="color:#E11D48;">${e(env.appUrl)}/admin</a></p>
          <p style="color:#64748B;font-size:12px;">If this was not expected, ignore this email. Ask to be added to ADMIN_EMAILS for permanent access.</p>
        </div>`,
    });
  } catch (err) {
    console.error('Invite email failed:', err);
    return NextResponse.json({ error: 'Could not send invite.' }, { status: 502, headers: NO_STORE });
  }

  try {
    const supabase = adminClient();
    const { data: inviter } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (inviter) {
      await supabase.from('admin_invitations').insert({
        email,
        token: crypto.randomUUID(),
        invited_by: inviter.id,
        expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      });
    }
  } catch {
    // invitation record is best-effort; email already sent
  }

  return NextResponse.json({ success: true }, { headers: NO_STORE });
}
