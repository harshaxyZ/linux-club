import { NextResponse } from 'next/server';
import { getSessionUser, isAdmin } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ isAdmin: false }, { status: 401 });
  const allowed = await isAdmin(user.email, user.id);
  if (!allowed) return NextResponse.json({ isAdmin: false }, { status: 403 });
  return NextResponse.json({ isAdmin: true, email: user.email });
}
