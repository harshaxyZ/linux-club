'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { BackgroundGrid } from '../../components/ui/BackgroundGrid';
import { AuthGate } from '../../components/auth/AuthGate';
import { ExternalLink, Trash2, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';
import { deviceHeaders } from '../../lib/device-client';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface AppData {
  full_name: string;
  usn: string;
  year: string;
  course: string;
  section: string;
  email: string;
  phone: string;
  github_url?: string | null;
  languages?: string[] | null;
  status: string;
  created_at: string;
  about_text: string;
}

export default function AccountPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [app, setApp] = useState<AppData | null>(null);
  const [deleted, setDeleted] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const loadMine = useCallback(async () => {
    try {
      const res = await fetch('/api/apply/mine');
      if (res.ok) {
        const data = await res.json();
        setApp(data.application ?? null);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email ?? null;
      setUserEmail(email);
      if (email) await loadMine();
      setChecked(true);
    }
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, s: Session | null) => {
      const email = s?.user?.email ?? null;
      setUserEmail(email);
      if (email) loadMine();
      else setApp(null);
    });
    return () => subscription.unsubscribe();
  }, [supabase, loadMine]);

  const withdraw = async () => {
    if (!confirm('Withdraw your application? This deletes it permanently.')) return;
    const res = await fetch('/api/apply/mine', { method: 'DELETE', headers: { ...deviceHeaders() } });
    if (res.ok) {
      setDeleted(true);
      setApp(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-body text-ink relative">
      <BackgroundGrid />
      <Header />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-ink-muted hover:text-ink mb-8">
            <ArrowLeft className="w-4 h-4 text-accent" /><span>Back to Home</span>
          </Link>

          {!checked ? (
            <div className="font-mono text-xs text-ink-muted text-center">Loading…</div>
          ) : !userEmail ? (
            <div className="flex flex-col items-center">
              <h1 className="font-heading font-extrabold text-2xl mb-6">Sign in to view your application</h1>
              <AuthGate purpose="apply" next="account" title="Sign in" subtitle="Use the same Google account or email you applied with." />
            </div>
          ) : deleted ? (
            <div className="minimal-card rounded-3xl p-12 text-center">
              <h2 className="font-heading font-extrabold text-2xl">Application Withdrawn</h2>
              <p className="text-sm text-ink-muted mt-2">Your record was deleted.</p>
              <Link href="/" className="mt-6 inline-block bg-[#E11D48] !text-white font-mono font-bold text-xs px-6 py-3 rounded-xl">Return Home</Link>
            </div>
          ) : !app ? (
            <div className="minimal-card rounded-3xl p-12 text-center">
              <h2 className="font-heading font-extrabold text-2xl">No application found</h2>
              <p className="text-sm text-ink-muted mt-2">Signed in as {userEmail}. No application is linked to this sign-in yet.</p>
              <Link href="/apply" className="mt-6 inline-block bg-[#E11D48] !text-white font-mono font-bold text-xs px-6 py-3 rounded-xl">Apply Now</Link>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="minimal-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-subsurface border border-border flex items-center justify-center font-extrabold text-xl">
                    {app.full_name.charAt(0)}
                  </div>
                  <div>
                    <h1 className="font-extrabold text-2xl">{app.full_name}</h1>
                    <p className="text-xs font-mono text-ink-muted mt-0.5">{app.usn} • {app.course} ({app.year})</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-mono font-bold border border-accent/20">
                  <Clock className="w-3.5 h-3.5" /><span className="capitalize">{app.status.replace('_', ' ')}</span>
                </span>
              </div>
              <div className="minimal-card rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm font-mono">
                  <div><span className="block text-[10px] text-ink-muted uppercase mb-1">Email</span><span>{app.email}</span></div>
                  <div><span className="block text-[10px] text-ink-muted uppercase mb-1">Phone</span><span>{app.phone}</span></div>
                  <div><span className="block text-[10px] text-ink-muted uppercase mb-1">GitHub</span>
                    {app.github_url ? (
                      <a href={app.github_url} target="_blank" rel="noreferrer" className="text-accent hover:underline inline-flex items-center gap-1">{app.github_url}<ExternalLink className="w-3.5 h-3.5" /></a>
                    ) : (
                      <span className="text-ink-muted">Not provided</span>
                    )}
                  </div>
                  <div><span className="block text-[10px] text-ink-muted uppercase mb-1">Submitted</span><span>{new Date(app.created_at).toLocaleDateString()}</span></div>
                </div>
                <div className="pt-4 border-t border-border">
                  <span className="block text-[10px] font-mono text-ink-muted uppercase mb-2">Statement</span>
                  <p className="text-xs bg-subsurface p-4 rounded-xl border border-border">{app.about_text}</p>
                </div>
              </div>
              <div className="minimal-card rounded-3xl p-6 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-accent">Withdraw Application</h4>
                  <p className="text-xs text-ink-muted mt-1">Permanently deletes your record.</p>
                </div>
                <button onClick={withdraw} className="inline-flex items-center gap-2 bg-[#E11D48] !text-white font-mono font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer">
                  <Trash2 className="w-4 h-4" /><span>Withdraw</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
