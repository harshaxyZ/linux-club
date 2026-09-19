import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * OAuth (PKCE) callback. The code is exchanged exactly once, here, on the
 * server.
 *
 * The previous client-side page exchanged twice: @supabase/auth-js auto-runs
 * the exchange during initialize() (detectSessionInUrl defaults to true) and
 * the page then retried manually. Because the app does not enable
 * `experimental.appendPkceFlowIdToRedirects`, no `sb_flow_id` reaches this URL,
 * so auth-js resolves the verifier through the fixed
 * `sb-<ref>-auth-token-code-verifier` key -- and the first attempt deletes that
 * key regardless of outcome. The retry therefore always failed with
 * "PKCE code verifier not found in storage", masking the real error.
 *
 * Cookies written by @supabase/ssr are httpOnly:false by default, so the
 * browser client still sees the session after this redirect.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get('code');
  const rawNext = req.nextUrl.searchParams.get('next') || '/apply';
  // Same-site paths only: blocks `//evil.com` and absolute-URL open redirects.
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/apply';

  const providerError =
    req.nextUrl.searchParams.get('error_description') || req.nextUrl.searchParams.get('error');
  if (providerError) {
    console.error('OAuth provider returned an error:', providerError);
    return NextResponse.redirect(new URL(`${next}?error=oauth`, origin));
  }
  if (!code) {
    return NextResponse.redirect(new URL(`${next}?error=oauth`, origin));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('OAuth callback: Supabase env vars missing');
    return NextResponse.redirect(new URL(`${next}?error=config`, origin));
  }

  // Cookie writes are buffered so they can be attached to whichever redirect
  // we end up returning (success or failure).
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

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  const destination = error ? `${next}?error=exchange` : next;
  if (error) {
    // Kept server-side on purpose: the old page echoed provider messages and
    // cookie names back into the URL.
    console.error('OAuth code exchange failed:', error.message);
  }

  const res = NextResponse.redirect(new URL(destination, origin));
  for (const { name, value, options } of pending) {
    res.cookies.set(name, value, options as Record<string, unknown> as never);
  }
  return res;
}
