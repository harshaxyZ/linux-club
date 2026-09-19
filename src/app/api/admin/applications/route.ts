import { NextRequest, NextResponse } from 'next/server';
import { adminClient, getSessionUser, isAdmin } from '@/lib/auth';
import { rateLimit } from '@/lib/security';
import { crossOriginDenied, isSameOrigin } from '@/lib/request';

const STATUSES = ['pending', 'under_review', 'accepted', 'rejected'] as const;

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !(await isAdmin(user.email, user.id))) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }
  if (!rateLimit(`admin:list:${user.id}`, 300, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim() ?? '';
  const year = searchParams.get('year') ?? 'All';
  const status = searchParams.get('status') ?? 'All';

  const supabase = adminClient();
  let query = supabase.from('applications').select('*').order('created_at', { ascending: false }).limit(500);

  if (year !== 'All') query = query.eq('year', year);
  if (status !== 'All') query = query.eq('status', status);
  if (search) {
    const s = search.replace(/[%_]/g, '');
    query = query.or(`full_name.ilike.%${s}%,usn.ilike.%${s}%,email.ilike.%${s}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Could not load.' }, { status: 500 });
  return NextResponse.json({ applications: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  if (!isSameOrigin(req)) return crossOriginDenied();

  const user = await getSessionUser();
  if (!user || !(await isAdmin(user.email, user.id))) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }
  if (!rateLimit(`admin:patch:${user.id}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? '');
  const status = String(body.status ?? '');

  if (!id || !(STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'Valid id and status required.' }, { status: 400 });
  }

  const supabase = adminClient();
  const { error } = await supabase.from('applications').update({ status }).eq('id', id);
  if (error) return NextResponse.json({ error: 'Update failed.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
