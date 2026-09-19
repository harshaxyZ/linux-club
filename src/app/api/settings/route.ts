import { NextResponse } from 'next/server';
import { applicationsAccepting, closedMessageFor, getAppSettings } from '@/lib/settings';

/**
 * Public, read-only view of the application window. Only the two fields the
 * apply page needs, so nothing internal leaks.
 */
export async function GET() {
  const settings = await getAppSettings();
  const open = applicationsAccepting(settings);
  return NextResponse.json(
    {
      applicationsOpen: open,
      closedMessage: open ? null : closedMessageFor(settings),
      closesAt: settings.closesAt,
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}
