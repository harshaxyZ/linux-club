'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';
import { BackgroundGrid } from '../../../components/ui/BackgroundGrid';
import { Terminal } from 'lucide-react';

/**
 * OAuth landing page. Supabase redirects here with `?code=...` (PKCE).
 * The browser client auto-exchanges the code during initialize(), so this
 * page only waits for the SIGNED_IN event — it never exchanges twice
 * (a second exchange burns the single-use code and throws a misleading
 * "verifier not found" error). Same behavior on localhost and prod.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next') || '/apply';
    const host = window.location.host;

    const fail = (reason: string, detail?: string) => {
      if (detail) console.error('OAuth exchange error:', detail);
      const sbNames =
        typeof document !== 'undefined'
          ? document.cookie
              .split(';')
              .map((c) => c.split('=')[0].trim())
              .filter((n) => n.startsWith('sb-'))
          : [];
      console.error('OAuth debug — sb cookies present:', sbNames.join(', ') || '(none)');
      setFailed(true);
      setTimeout(
        () =>
          router.replace(
            `${next}?error=${reason}&host=${encodeURIComponent(host)}&cookies=${
              sbNames.length > 0 ? '1' : '0'
            }&detail=${encodeURIComponent((detail || 'unknown').slice(0, 120))}&slots=${encodeURIComponent(
              sbNames.join(',').slice(0, 160)
            )}`
          ),
        900
      );
    };

    if (params.get('error') || params.get('error_description')) {
      fail('oauth');
      return;
    }
    if (!params.get('code')) {
      fail('oauth');
      return;
    }

    let done = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (done) return;
      if (event === 'SIGNED_IN' && session?.user) {
        done = true;
        router.replace(next);
      }
    });

    // initialize() auto-exchanges ?code=. Verify once after it settles.
    const timer = setTimeout(async () => {
      if (done) return;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          done = true;
          router.replace(next);
          return;
        }
      } catch {
        // fall through to single retry
      }
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (done) return;
        if (!error) {
          done = true;
          router.replace(next);
          return;
        }
        fail('exchange', error.message);
      } else {
        // Code already consumed but no session persisted (cookies blocked?).
        fail('exchange', 'code consumed, no session persisted');
      }
    }, 6000);

    return () => {
      done = true;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <BackgroundGrid />
      <div className="minimal-card rounded-3xl p-8 max-w-sm w-full text-center relative z-10">
        <Terminal className="w-8 h-8 text-accent mx-auto mb-4" />
        <p className="font-mono text-xs text-ink-muted">
          {failed ? 'Sign-in failed — taking you back…' : 'Completing sign-in…'}
        </p>
      </div>
    </div>
  );
}
