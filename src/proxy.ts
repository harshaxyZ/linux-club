import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from './lib/supabase/session';

function canonicalHost(): string | null {
  try {
    const raw = process.env.NEXT_PUBLIC_APP_URL;
    if (!raw) return null;
    return new URL(raw).host.toLowerCase();
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  // PKCE verifier cookies are host-bound. If the flow starts on www.* and
  // finishes on apex (or vice versa), the callback can't read the verifier
  // and OAuth dies with "code verifier not found". Pin www-aliases to canonical
  // so every flow starts and ends on the same host.
  const host = (request.headers.get('host') || '').split(':')[0].toLowerCase();
  const canonical = canonicalHost();
  if (
    canonical &&
    host &&
    host !== canonical &&
    host !== 'localhost' &&
    host !== '127.0.0.1' &&
    (host === `www.${canonical}` || canonical === `www.${host}`)
  ) {
    const url = request.nextUrl.clone();
    url.host = canonical;
    return NextResponse.redirect(url, 308);
  }

  return await updateSession(request);
}

export const config = {
  // /auth/callback is excluded on purpose: it writes its own session cookies
  // after the PKCE exchange, and a redirect mid-flow would strand the verifier
  // cookie on the other host.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
