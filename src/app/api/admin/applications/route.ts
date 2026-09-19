import { NextRequest, NextResponse } from 'next/server';
import { adminClient, getSessionUser, isAdmin } from '@/lib/auth';
import { sanitizeFilterValue } from '@/lib/security';
import { rateLimitAll } from '@/lib/rate-limit';
import { crossOriginDenied, isSameOrigin } from '@/lib/request';
import { sendEmail } from '@/lib/email';
import { decisionEmailHtml, decisionSubject, isNotifyingStatus } from '@/lib/email-decision';

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
  // The tracker reads a page; an export asks for everything matching the filters.
  // Capped so a stray value cannot pull the whole table into memory.
  const requested = Number.parseInt(searchParams.get('limit') ?? '', 10);
  const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 5000) : 500;

  const supabase = adminClient();
  let query = supabase.from('applications').select('*').order('created_at', { ascending: false }).limit(limit);

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

  // Read first so an unchanged status does not re-send a decision email when a
  // reviewer clicks the same button twice.
  const { data: before } = await supabase
    .from('applications')
    .select('status,full_name,email')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase.from('applications').update({ status }).eq('id', id);
  if (error) {
    console.error('Admin status update failed:', error.message);
    return NextResponse.json({ error: 'Update failed.' }, { status: 500, headers: NO_STORE });
  }

  const previous = (before as { status?: string } | null)?.status ?? null;
  const changed = previous !== status;
  let notified: 'sent' | 'failed' | 'not_applicable' = 'not_applicable';
  let notifyError: string | null = null;

  if (changed && isNotifyingStatus(status) && before) {
    const applicant = before as { full_name?: string; email?: string };
    if (applicant.email) {
      try {
        const result = await sendEmail({
          to: applicant.email,
          subject: decisionSubject(status),
          html: decisionEmailHtml(status, applicant.full_name ?? 'there'),
        });
        notified = 'sent';
        console.log(`Decision email (${status}) delivered by ${result.channel}`);
      } catch (mailErr) {
        // The status change already succeeded; surface the delivery failure
        // instead of rolling it back or hiding it.
        notified = 'failed';
        notifyError = mailErr instanceof Error ? mailErr.message : String(mailErr);
        console.error(`Decision email (${status}) failed on every channel:`, notifyError);
      }
    }
  }

  return NextResponse.json(
    { success: true, status, previous, changed, notified, notifyError },
    { headers: NO_STORE }
  );
}
