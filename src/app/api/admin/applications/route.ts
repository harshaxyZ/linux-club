import { NextRequest, NextResponse } from 'next/server';
import { adminClient, getSessionUser, isAdmin } from '@/lib/auth';
import { sanitizeFilterValue } from '@/lib/security';
import { rateLimitAll } from '@/lib/rate-limit';
import { crossOriginDenied, isSameOrigin } from '@/lib/request';

const STATUSES = ['pending', 'under_review', 'accepted', 'rejected'] as const;
const YEARS = ['1st', '2nd', '3rd', '4th'] as const;
// Applicant records are PII: never let a proxy or the browser cache them.
const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' } as const;

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !(await isAdmin(user.email, user.id))) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403, headers: NO_STORE });
  }
  if (!(await rateLimitAll([{ key: `admin:list:${user.id}`, limit: 300, windowMs: 60 * 1000 }]))) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: NO_STORE });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim() ?? '';
  const year = searchParams.get('year') ?? 'All';
  const status = searchParams.get('status') ?? 'All';

  const supabase = adminClient();
  let query = supabase.from('applications').select('*').order('created_at', { ascending: false }).limit(500);

  if ((YEARS as readonly string[]).includes(year)) query = query.eq('year', year);
  if ((STATUSES as readonly string[]).includes(status)) query = query.eq('status', status);
  if (search) {
    // `or()` parses a comma-separated list of column.op.value triples, so an
    // unescaped comma or parenthesis in the search box injected extra filter
    // terms. Only search-meaningful characters survive sanitizeFilterValue.
    const s = sanitizeFilterValue(search);
    if (s) {
      query = query.or(`full_name.ilike.%${s}%,usn.ilike.%${s}%,email.ilike.%${s}%`);
    }
  }

  const { data, error } = await query;
  if (error) {
    console.error('Admin list failed:', error.message);
    return NextResponse.json({ error: 'Could not load.' }, { status: 500, headers: NO_STORE });
  }
  return NextResponse.json({ applications: data ?? [] }, { headers: NO_STORE });
}

export async function PATCH(req: NextRequest) {
  if (!isSameOrigin(req)) return crossOriginDenied();

  const user = await getSessionUser();
  if (!user || !(await isAdmin(user.email, user.id))) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403, headers: NO_STORE });
  }
  if (!(await rateLimitAll([{ key: `admin:patch:${user.id}`, limit: 60, windowMs: 60 * 1000 }]))) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: NO_STORE });
  }

  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? '');
  const status = String(body.status ?? '');
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!UUID_RE.test(id) || !(STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'Valid id and status required.' }, { status: 400, headers: NO_STORE });
  }

  const supabase = adminClient();
  const { error } = await supabase.from('applications').update({ status }).eq('id', id);
  if (error) {
    console.error('Admin status update failed:', error.message);
    return NextResponse.json({ error: 'Update failed.' }, { status: 500, headers: NO_STORE });
  }
  return NextResponse.json({ success: true }, { headers: NO_STORE });
}
