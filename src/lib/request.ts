import { NextResponse } from 'next/server';

/**
 * Same-origin enforcement for mutating API routes.
 * Browsers attach Origin (CORS-safelisted POST) or Referer; both must match
 * the request host or the configured NEXT_PUBLIC_APP_URL host.
 * Non-browser clients without these headers are rejected on mutations.
 */
export function isSameOrigin(req: Request): boolean {
  try {
    const url = new URL(req.url);
    const allowed = new Set<string>([url.host]);
    const configured = process.env.NEXT_PUBLIC_APP_URL;
    if (configured) {
      try {
        allowed.add(new URL(configured).host);
      } catch { /* ignore bad config */ }
    }
    if (process.env.NODE_ENV === 'development') {
      allowed.add('localhost:3000');
      allowed.add('127.0.0.1:3000');
    }

    const origin = req.headers.get('origin');
    if (origin) {
      try {
        return allowed.has(new URL(origin).host);
      } catch {
        return false;
      }
    }
    const referer = req.headers.get('referer');
    if (referer) {
      try {
        return allowed.has(new URL(referer).host);
      } catch {
        return false;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export function crossOriginDenied(): NextResponse {
  return NextResponse.json({ error: 'Cross-origin request denied.' }, { status: 403 });
}
