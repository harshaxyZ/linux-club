import { NextRequest, NextResponse } from 'next/server';
import { adminClient, getSessionUser } from '@/lib/auth';
import { normalizeEmail } from '@/lib/security';
import { rateLimitAll } from '@/lib/rate-limit';
import { crossOriginDenied, isSameOrigin } from '@/lib/request';
import { findApplicationFor } from '@/lib/applications';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401, headers: NO_STORE });
  }

  const authEmail = user.email ? normalizeEmail(user.email) : '';
  try {
    const application = await findApplicationFor(adminClient(), user.id, authEmail);
    return NextResponse.json({ application: application ?? null }, { headers: NO_STORE });
  } catch (err) {
    console.error('Application lookup failed:', err);
    return NextResponse.json({ error: 'Could not load application.' }, { status: 500, headers: NO_STORE });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isSameOrigin(req)) return crossOriginDenied();

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401, headers: NO_STORE });
  }

  const allowed = await rateLimitAll([
    { key: `withdraw:user:${user.id}`, limit: 10, windowMs: 60 * 60 * 1000 },
  ]);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: NO_STORE });
  }

  const supabase = adminClient();
  const { error: byUserError } = await supabase.from('applications').delete().eq('user_id', user.id);
  if (byUserError) {
    return NextResponse.json({ error: 'Could not withdraw.' }, { status: 500, headers: NO_STORE });
  }

  // Also clears the row created under the caller's other login method for the
  // same address. Only the verified sign-in email is used here: deleting by the
  // form-supplied email let a signed-in user remove someone else's record.
  const authEmail = user.email ? normalizeEmail(user.email) : '';
  if (authEmail) {
    const { error } = await supabase.from('applications').delete().eq('email', authEmail);
    if (error) {
      return NextResponse.json({ error: 'Could not withdraw.' }, { status: 500, headers: NO_STORE });
    }
  }
  return NextResponse.json({ success: true }, { headers: NO_STORE });
}
