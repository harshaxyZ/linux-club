import { NextRequest, NextResponse } from 'next/server';
import { adminClient, isAdminEmail } from '@/lib/auth';
import { env } from '@/lib/env';
import { sendEmail, otpEmailHtml } from '@/lib/email';
import { getClientIp, isValidEmail, normalizeEmail } from '@/lib/security';
import { rateLimitAll } from '@/lib/rate-limit';
import { ensureDeviceCookie, isValidDeviceId, resolveDeviceId } from '@/lib/device';
import { crossOriginDenied, isSameOrigin } from '@/lib/request';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

function randomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

/**
 * Passwordless email OTP via Supabase, delivered through Resend (primary)
 * with Brevo fallback. We mint Supabase's own `email_otp` with
 * admin.generateLink, then deliver that code ourselves so the project never
 * depends on Supabase SMTP.
 *
 * Client verifies with: supabase.auth.verifyOtp({ email, token, type: 'magiclink' })
 *
 * Abuse controls: same-origin POST, required device id, and three durable
 * rate-limit buckets (per email, per device, per IP).
 */
export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) return crossOriginDenied();

    const deviceId =
      resolveDeviceId(req.headers, req.cookies) ??
      (() => {
        const h = req.headers.get('x-device-id')?.trim() ?? '';
        return h && isValidDeviceId(h) ? h : null;
      })();
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device verification missing. Reload and try again.' },
        { status: 400, headers: NO_STORE }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawEmail = String(body.email ?? '');
    const purpose = body.purpose === 'admin' ? 'admin' : 'apply';

    if (!isValidEmail(rawEmail)) {
      return NextResponse.json({ error: 'Valid email required.' }, { status: 400, headers: NO_STORE });
    }
    const email = normalizeEmail(rawEmail);

    // Admin codes go to ADMIN_EMAILS *or* anyone in the admins table, so console
    // access does not depend on redeploying with a new env var.
    if (purpose === 'admin' && !(await isAdminEmail(email))) {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 403, headers: NO_STORE });
    }

    const ip = getClientIp(req.headers);
    const allowed = await rateLimitAll([
      { key: `otp:email:${email}`, limit: 10, windowMs: 60 * 60 * 1000 },
      { key: `otp:device:${deviceId}`, limit: 5, windowMs: 60 * 60 * 1000 },
      { key: `otp:ip:${ip}`, limit: 20, windowMs: 60 * 60 * 1000 },
    ]);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many codes requested. Try again in an hour.' },
        { status: 429, headers: NO_STORE }
      );
    }

    const admin = adminClient();
    const redirectTo = `${env.appUrl}/${purpose === 'admin' ? 'admin' : 'apply'}`;

    // generateLink first: it succeeds for every existing user. Only when the
    // address is unknown do we create the account and retry. The previous
    // implementation called listUsers() with no pagination on every request,
    // which pulled the whole user table and silently stopped finding users past
    // the first page.
    let result = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    });

    if (result.error && /not\s*found|user_not_found|no user/i.test(result.error.message)) {
      const { error: createError } = await admin.auth.admin.createUser({
        email,
        password: randomPassword(),
        email_confirm: true,
      });
      if (createError && !/already|exists|registered/i.test(createError.message)) {
        console.error('OTP createUser failed:', createError.message);
        return NextResponse.json({ error: 'Could not start sign-in.' }, { status: 500, headers: NO_STORE });
      }
      result = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo },
      });
    }

    const code = result.data?.properties?.email_otp;
    if (result.error || !code) {
      console.error('OTP generateLink failed:', result.error?.message);
      return NextResponse.json({ error: 'Could not start sign-in.' }, { status: 500, headers: NO_STORE });
    }

    try {
      await sendEmail({
        to: email,
        subject: `Your ${purpose === 'admin' ? 'admin' : 'club'} sign-in code`,
        html: otpEmailHtml(code),
      });
    } catch (mailErr) {
      console.error('OTP email delivery failed (resend+brevo):', mailErr);
      return NextResponse.json(
        { error: 'Could not deliver sign-in email. Try Google sign-in.' },
        { status: 502, headers: NO_STORE }
      );
    }

    const res = NextResponse.json({ success: true, length: code.length }, { headers: NO_STORE });
    ensureDeviceCookie(res, deviceId, process.env.NODE_ENV === 'production');
    return res;
  } catch (err) {
    console.error('send-otp error:', err);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500, headers: NO_STORE });
  }
}
