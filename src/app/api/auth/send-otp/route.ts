import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/auth';
import { env } from '@/lib/env';
import { sendEmail, otpEmailHtml } from '@/lib/email';
import { getClientIp, isValidEmail, normalizeEmail, rateLimit } from '@/lib/security';
import { ensureDeviceCookie, isValidDeviceId, resolveDeviceId } from '@/lib/device';
import { crossOriginDenied, isSameOrigin } from '@/lib/request';

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
 * Client verifies with: supabase.auth.verifyOtp({ email, token, type: 'email' })
 *
 * Abuse controls: same-origin POST, required device id, and three rate-limit
 * buckets (per email, per device, per IP).
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
      return NextResponse.json({ error: 'Device verification missing. Reload and try again.' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const rawEmail = String(body.email ?? '');
    const purpose = body.purpose === 'admin' ? 'admin' : 'apply';

    if (!isValidEmail(rawEmail)) {
      return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });
    }
    const email = normalizeEmail(rawEmail);

    if (purpose === 'admin' && !env.adminEmails.includes(email)) {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
    }

    const ip = getClientIp(req.headers);
    const limited =
      !rateLimit(`otp:email:${email}`, 10, 60 * 60 * 1000) ||
      !rateLimit(`otp:device:${deviceId}`, 5, 60 * 60 * 1000) ||
      !rateLimit(`otp:ip:${ip}`, 20, 60 * 60 * 1000);
    if (limited) {
      return NextResponse.json(
        { error: 'Too many codes requested. Try again in an hour.' },
        { status: 429 }
      );
    }

    const admin = adminClient();

    // Ensure the user exists so magiclink works for first-time applicants.
    const { data: existing } = await admin.auth.admin.listUsers();
    const found = existing?.users?.some((u) => u.email?.toLowerCase() === email);
    if (!found) {
      const { error: createError } = await admin.auth.admin.createUser({
        email,
        password: randomPassword(),
        email_confirm: true,
      });
      if (createError && !/already|exists|registered/i.test(createError.message)) {
        console.error('OTP createUser failed:', createError.message);
        return NextResponse.json({ error: 'Could not start sign-in.' }, { status: 500 });
      }
    }

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${env.appUrl}/${purpose === 'admin' ? 'admin' : 'apply'}`,
      },
    });

    if (error || !data?.properties?.email_otp) {
      console.error('OTP generateLink failed:', error?.message);
      return NextResponse.json({ error: 'Could not start sign-in.' }, { status: 500 });
    }

    const code = data.properties.email_otp;

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
        { status: 502 }
      );
    }

    const res = NextResponse.json({ success: true });
    ensureDeviceCookie(res, deviceId, process.env.NODE_ENV === 'production');
    return res;
  } catch (err) {
    console.error('send-otp error:', err);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}
