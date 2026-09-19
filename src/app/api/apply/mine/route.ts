import { NextRequest, NextResponse } from 'next/server';
import { adminClient, getSessionUser } from '@/lib/auth';
import { normalizeEmail, rateLimit } from '@/lib/security';
import { crossOriginDenied, isSameOrigin } from '@/lib/request';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const supabase = adminClient();
  const { data: byUser } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (byUser) return NextResponse.json({ application: byUser });

  // Same person, different login method (Google vs email OTP share the email).
  const authEmail = user.email ? normalizeEmail(user.email) : '';
  if (authEmail) {
    const { data: byEmail, error } = await supabase
      .from('applications')
      .select('*')
      .eq('email', authEmail)
      .maybeSingle();
    if (!error && byEmail) return NextResponse.json({ application: byEmail });
  }
  return NextResponse.json({ application: null });
}

export async function DELETE(req: NextRequest) {
  if (!isSameOrigin(req)) return crossOriginDenied();

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  if (!rateLimit(`withdraw:user:${user.id}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const supabase = adminClient();
  const { error: byUserError } = await supabase.from('applications').delete().eq('user_id', user.id);
  if (byUserError) {
    return NextResponse.json({ error: 'Could not withdraw.' }, { status: 500 });
  }
  const authEmail = user.email ? normalizeEmail(user.email) : '';
  if (authEmail) {
    const { error } = await supabase.from('applications').delete().eq('email', authEmail);
    if (error) {
      return NextResponse.json({ error: 'Could not withdraw.' }, { status: 500 });
    }
  }
  return NextResponse.json({ success: true });
}
