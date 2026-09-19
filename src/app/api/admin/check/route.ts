import { NextResponse } from 'next/server';
import { getSessionUser, isAdmin } from '@/lib/auth';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ isAdmin: false }, { status: 401, headers: NO_STORE });
  const allowed = await isAdmin(user.email, user.id);
  if (!allowed) return NextResponse.json({ isAdmin: false }, { status: 403, headers: NO_STORE });
  return NextResponse.json({ isAdmin: true, email: user.email }, { headers: NO_STORE });
}
