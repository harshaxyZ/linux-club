import { NextRequest, NextResponse } from 'next/server';
import { adminClient, getSessionUser, isAdmin } from '@/lib/auth';
import { rateLimitAll } from '@/lib/rate-limit';
import { crossOriginDenied, isSameOrigin } from '@/lib/request';
import { applicationsAccepting, clearAppSettingsCache, getAppSettings } from '@/lib/settings';

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' } as const;

function payload(settings: Awaited<ReturnType<typeof getAppSettings>>) {
  return {
    applicationsOpen: settings.applicationsOpen,
    accepting: applicationsAccepting(settings),
    closedMessage: settings.closedMessage,
    closesAt: settings.closesAt,
    updatedAt: settings.updatedAt,
    updatedBy: settings.updatedBy,
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user || !(await isAdmin(user.email, user.id))) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403, headers: NO_STORE });
  }
  return NextResponse.json(payload(await getAppSettings(true)), { headers: NO_STORE });
}

export async function PATCH(req: NextRequest) {
  if (!isSameOrigin(req)) return crossOriginDenied();

  const user = await getSessionUser();
  if (!user || !(await isAdmin(user.email, user.id))) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403, headers: NO_STORE });
  }
  if (!(await rateLimitAll([{ key: `admin:settings:${user.id}`, limit: 30, windowMs: 60 * 1000 }]))) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: NO_STORE });
  }

  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = { updated_by: user.email ?? null };

  if (typeof body.applicationsOpen === 'boolean') {
    update.applications_open = body.applicationsOpen;
  }
  if (body.closedMessage !== undefined) {
    const message = String(body.closedMessage ?? '').trim().slice(0, 300);
    update.closed_message = message || null;
  }
  if (body.closesAt !== undefined) {
    const raw = String(body.closesAt ?? '').trim();
    if (!raw) {
      update.closes_at = null;
    } else {
      const when = new Date(raw);
      if (Number.isNaN(when.getTime())) {
        return NextResponse.json({ error: 'Deadline is not a valid date.' }, { status: 400, headers: NO_STORE });
      }
      update.closes_at = when.toISOString();
    }
  }

  if (Object.keys(update).length === 1) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400, headers: NO_STORE });
  }

  const { error } = await adminClient().from('app_settings').update(update).eq('id', true);
  if (error) {
    console.error('Settings update failed:', error.message);
    return NextResponse.json(
      { error: 'Could not save settings. Has the app_settings migration been applied?' },
      { status: 500, headers: NO_STORE }
    );
  }

  clearAppSettingsCache();
  const settings = await getAppSettings(true);
  console.log(
    `Application window set to ${applicationsAccepting(settings) ? 'OPEN' : 'CLOSED'} by ${user.email}`
  );
  return NextResponse.json(payload(settings), { headers: NO_STORE });
}
