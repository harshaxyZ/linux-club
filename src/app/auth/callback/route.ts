import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * OAuth (PKCE) callback. The code is exchanged exactly once, here, on the
 * server.
 *
 * The previous client-side page exchanged twice: @supabase/auth-js auto-runs the
 * exchange during initialize() (detectSessionInUrl defaults to true) and the page
 * then retried manually. Because the app does not enable
 * `experimental.appendPkceFlowIdToRedirects`, no `sb_flow_id` reaches this URL,
 * so auth-js resolves the verifier through the fixed
 * `sb-<ref>-auth-token-code-verifier` key -- and the first attempt deletes that
 * key regardless of outcome. The retry therefore always failed with
 * "PKCE code verifier not found in storage", masking the real error.
 *
 * Cookies written by @supabase/ssr are httpOnly:false by default, so the browser
 * client still sees the session after this redirect.
 */

// Never let a CDN or browser reuse a redirect that carries session cookies.
const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' } as const;

function storageKeyFor(supabaseUrl: string): string {
  try {
    // @supabase/ssr derives the cookie name from the project ref.
    const ref = new URL(supabaseUrl).hostname.split('.')[0];
    return `sb-${ref}-auth-token`;
  } catch {
    return 'sb-unknown-auth-token';
  }
}

/**
 * Logs which Supabase cookies arrived, names only, never values. This is the
 * difference between "the browser never sent the verifier" and "Supabase
 * rejected the code", which look identical from the outside.
 */
function logCookieDiagnostics(req: NextRequest, storageKey: string): void {
  const names = req.cookies.getAll().map((c) => c.name);
  const sb = names.filter((n) => n.startsWith('sb-'));
  const legacyVerifier = `${storageKey}-code-verifier`;
  console.error(
    '[oauth-callback] host=%s cookies_total=%d sb_cookies=%s legacy_verifier_present=%s flow_slots=%d',
    req.headers.get('host') ?? 'unknown',
    names.length,
    sb.join(',') || '(none)',
    sb.includes(legacyVerifier),
    sb.filter((n) => n.includes('-flow-') && n.endsWith('-code-verifier')).length
  );
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get('code');
  const rawNext = req.nextUrl.searchParams.get('next') || '/apply';
  // Same-site paths only: blocks `//evil.com` and absolute-URL open redirects.
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/apply';

  const redirect = (path: string) => {
    const res = NextResponse.redirect(new URL(path, origin));
    res.headers.set('Cache-Control', NO_STORE['Cache-Control']);
    return res;
  };

  const providerError =
    req.nextUrl.searchParams.get('error_description') || req.nextUrl.searchParams.get('error');
  if (providerError) {
    console.error('[oauth-callback] provider returned an error:', providerError);
    return redirect(`${next}?error=oauth`);
  }
  if (!code) {
    console.error('[oauth-callback] no code on the callback URL (host=%s)', req.headers.get('host'));
    return redirect(`${next}?error=oauth`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[oauth-callback] Supabase env vars missing');
    return redirect(`${next}?error=config`);
  }

  // Cookie writes are buffered so they can be attached to whichever redirect we
  // end up returning (success or failure).
  const pending: Array<{ name: string; value: string; options?: object }> = [];
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: object }>) {
        pending.push(...cookiesToSet);
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Details stay server-side: the old page echoed provider messages and cookie
    // names back into the URL.
    logCookieDiagnostics(req, storageKeyFor(supabaseUrl));
    console.error('[oauth-callback] exchange failed: %s (code=%s status=%s)', error.message, error.code, error.status);
    const res = redirect(`${next}?error=exchange`);
    for (const { name, value, options } of pending) {
      res.cookies.set(name, value, options as Record<string, unknown> as never);
    }
    return res;
  }

  if (!data.session) {
    logCookieDiagnostics(req, storageKeyFor(supabaseUrl));
    console.error('[oauth-callback] exchange returned no session');
    return redirect(`${next}?error=exchange`);
  }

  console.log(
    '[oauth-callback] signed in user=%s cookies_written=%d host=%s',
    data.session.user.id,
    pending.length,
    req.headers.get('host') ?? 'unknown'
  );

  const res = redirect(next);
  for (const { name, value, options } of pending) {
    res.cookies.set(name, value, options as Record<string, unknown> as never);
  }
  return res;
}
