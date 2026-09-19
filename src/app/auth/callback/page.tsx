'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';
import { BackgroundGrid } from '../../../components/ui/BackgroundGrid';
import { Terminal } from 'lucide-react';

/**
 * OAuth landing page. Supabase redirects here with `?code=...` (PKCE).
 * The exchange runs in the browser, which holds the PKCE verifier —
 * no server round-trip, so this behaves identically on localhost and prod.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const next = params.get('next') || '/apply';
    const providerError = params.get('error') || params.get('error_description');

    if (providerError || !code) {
      router.replace(`${next}?error=oauth`);
      return;
    }

    let cancelled = false;
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (cancelled) return;
      if (error) {
        console.error('OAuth exchange error:', error.message);
        setFailed(true);
        setTimeout(() => router.replace(`${next}?error=exchange`), 1200);
      } else {
        router.replace(next);
      }
    });
    return () => {
      cancelled = true;
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
