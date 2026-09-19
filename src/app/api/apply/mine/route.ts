import { NextRequest, NextResponse } from 'next/server';
import { adminClient, getSessionUser } from '@/lib/auth';
import { rateLimit } from '@/lib/security';
import { crossOriginDenied, isSameOrigin } from '@/lib/request';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const supabase = adminClient();
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Could not load application.' }, { status: 500 });
  }
  return NextResponse.json({ application: data ?? null });
}

export async function DELETE(req: NextRequest) {
  if (!isSameOrigin(req)) return crossOriginDenied();

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  if (!rateLimit(`withdraw:user:${user.id}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const supabase = adminClient();
  const { error } = await supabase.from('applications').delete().eq('user_id', user.id);
  if (error) {
    return NextResponse.json({ error: 'Could not withdraw.' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
