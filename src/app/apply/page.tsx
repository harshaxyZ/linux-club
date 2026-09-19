'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { BackgroundGrid } from '../../components/ui/BackgroundGrid';
import { AuthGate } from '../../components/auth/AuthGate';
import {
  ArrowLeft, CheckCircle2, Plus, Trash2, Code2 as Github,
  Globe as Linkedin, AlertCircle, Terminal, LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';
import { deviceHeaders } from '../../lib/device-client';
import type { User } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface ExtraLink {
  label: string;
  url: string;
}

export default function ApplyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [existingApp, setExistingApp] = useState<Record<string, unknown> | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');
  const [usn, setUsn] = useState('');
  const [course, setCourse] = useState('');
  const [courseOther, setCourseOther] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [extraLinks, setExtraLinks] = useState<ExtraLink[]>([]);
  const [aboutText, setAboutText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        // Prefill from Google profile; user can still edit everything.
        const metaName = String(u.user_metadata?.full_name ?? u.user_metadata?.name ?? '');
        if (metaName) setFullName((v) => v || metaName);
        if (u.email) setEmail((v) => v || u.email as string);
        try {
          const res = await fetch('/api/apply/mine');
          if (res.ok) {
            const data = await res.json();
            if (data.application) setExistingApp(data.application);
          }
        } catch { /* ignore */ }
      }
      setAuthChecked(true);
    }
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const metaName = String(u.user_metadata?.full_name ?? u.user_metadata?.name ?? '');
        if (metaName) setFullName((v) => v || metaName);
        if (u.email) setEmail((v) => v || u.email as string);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setExistingApp(null);
  };

  const addExtraLink = () => {
    if (extraLinks.length < 3) setExtraLinks([...extraLinks, { label: 'LeetCode', url: '' }]);
  };
  const removeExtraLink = (i: number) => setExtraLinks(extraLinks.filter((_, x) => x !== i));
  const changeExtra = (i: number, field: 'label' | 'url', v: string) => {
    const c = [...extraLinks];
    c[i][field] = v;
    setExtraLinks(c);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!fullName || !year || !section || !usn || !course || !email || !cleanPhone || !githubUrl || !aboutText) {
      setErrorMsg('Please fill in all required fields marked with *');
      return;
    }
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (course === 'Others' && !courseOther) {
      setErrorMsg('Please specify your branch/course name.');
      return;
    }
    if (aboutText.trim().length < 20) {
      setErrorMsg('Tell us a bit more (min 20 characters).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...deviceHeaders() },
        body: JSON.stringify({
          fullName, year, section, usn,
          course: course === 'Others' ? courseOther : course,
          courseOther, email, phone: cleanPhone,
          githubUrl, linkedinUrl, extraLinks, aboutText,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error || 'Submission failed. Try again.');
        setLoading(false);
        return;
      }
      setLoading(false);
      setSubmitted(true);
    } catch {
      setErrorMsg('Network error. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-body text-ink relative selection:bg-rose-600 selection:text-white transition-colors duration-200">
      <BackgroundGrid />
      <Header showNav={false} />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-ink-muted hover:text-ink transition-colors mb-8">
            <ArrowLeft className="w-4 h-4 text-accent" />
            <span>Back to Home</span>
          </Link>

          {!authChecked ? (
            <div className="minimal-card rounded-3xl p-12 text-center text-sm font-mono text-ink-muted">Checking sign-in…</div>
          ) : !user ? (
            <div className="flex flex-col items-center">
              <div className="text-center mb-6">
                <span className="font-mono text-xs text-accent uppercase tracking-widest">{'// Step 1 — Sign in'}</span>
                <h1 className="font-heading font-extrabold text-ink text-3xl mt-1">Sign in to apply</h1>
                <p className="text-sm text-ink-muted mt-2">Google or a 6-digit email code. Your name and email are prefilled after sign-in.</p>
              </div>
              <AuthGate purpose="apply" next="apply" title="Verify account" subtitle="Prevents spam and links the application to you." />
            </div>
          ) : submitted || existingApp ? (
            <div className="minimal-card rounded-3xl p-8 sm:p-12 text-center shadow-2xl flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-6 border border-accent/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="font-mono text-xs text-accent uppercase tracking-widest mb-2">{'// Application Logged'}</span>
              <h1 className="font-heading font-extrabold text-ink text-3xl sm:text-4xl tracking-tight">
                {submitted ? 'Application Submitted' : 'Already Applied'}
              </h1>
              <p className="text-sm text-ink-muted mt-4 max-w-lg leading-relaxed">
                {submitted
                  ? 'The core team received your submission and will review it after the registration drive.'
                  : 'We already have an application linked to this sign-in. The core team will review it after the registration drive.'}
              </p>
              <p className="mt-4 text-xs font-mono text-ink-muted">Signed in as {user.email}</p>
              <div className="mt-8 flex gap-4">
                <Link href="/" className="bg-surface hover:bg-subsurface border border-border text-ink text-xs font-mono font-semibold px-6 py-3 rounded-xl">Return Home</Link>
                <button onClick={signOut} className="text-xs font-mono text-ink-muted hover:text-ink px-4 cursor-pointer inline-flex items-center gap-1.5">
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="minimal-card rounded-3xl p-6 sm:p-10 shadow-2xl">
              <div className="border-b border-border pb-6 mb-8 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-accent uppercase tracking-wider mb-1">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>{'// Step 2 — Application Form'}</span>
                  </div>
                  <h1 className="font-heading font-extrabold text-ink text-2xl sm:text-4xl tracking-tight">Apply for Membership</h1>
                  <p className="text-xs sm:text-sm text-ink-muted mt-2">Signed in as <span className="text-ink font-mono">{user.email}</span>. Name and email are prefilled — edit if needed.</p>
                </div>
                <button onClick={signOut} className="text-xs font-mono text-ink-muted hover:text-ink shrink-0 cursor-pointer inline-flex items-center gap-1.5">
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
                <div>
                  <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">Full Name *</label>
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name"
                    className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">Academic Year *</label>
                    <select required value={year} onChange={(e) => setYear(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink focus:outline-none focus:border-accent">
                      <option value="" disabled>-- Select --</option>
                      <option value="1st">1st Year</option>
                      <option value="2nd">2nd Year</option>
                      <option value="3rd">3rd Year</option>
                      <option value="4th">4th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">Section *</label>
                    <input type="text" required value={section} onChange={(e) => setSection(e.target.value.toUpperCase())} placeholder="e.g. A"
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink uppercase focus:outline-none focus:border-accent" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">USN *</label>
                    <input type="text" required value={usn} onChange={(e) => setUsn(e.target.value.toUpperCase())} placeholder="College USN"
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm font-mono text-ink uppercase focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">Branch *</label>
                    <select required value={course} onChange={(e) => setCourse(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink focus:outline-none focus:border-accent">
                      <option value="" disabled>-- Select --</option>
                      <option value="CSE">Computer Science (CSE)</option>
                      <option value="AI ML">AI &amp; ML</option>
                      <option value="AI DS">AI &amp; DS</option>
                      <option value="ISE">Information Science</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="IOT">IoT &amp; Cyber Security</option>
                      <option value="MECHANICAL">Mechanical</option>
                      <option value="CIVIL">Civil</option>
                      <option value="Others">Other</option>
                    </select>
                  </div>
                </div>
                {course === 'Others' && (
                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">Specify Branch *</label>
                    <input type="text" required value={courseOther} onChange={(e) => setCourseOther(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink focus:outline-none focus:border-accent" />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">Email *</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">Phone *</label>
                    <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile"
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm font-mono text-ink focus:outline-none focus:border-accent" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5" /><span>GitHub URL *</span>
                    </label>
                    <input type="url" required value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/username"
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Linkedin className="w-3.5 h-3.5 text-accent" /><span>LinkedIn (optional)</span>
                    </label>
                    <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/username"
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink focus:outline-none focus:border-accent" />
                  </div>
                </div>
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-semibold text-ink uppercase tracking-wider">Extra Profiles (max 3)</label>
                    {extraLinks.length < 3 && (
                      <button type="button" onClick={addExtraLink} className="inline-flex items-center gap-1 text-xs font-mono text-accent hover:underline cursor-pointer">
                        <Plus className="w-3.5 h-3.5" /><span>Add Link</span>
                      </button>
                    )}
                  </div>
                  {extraLinks.map((link, idx) => (
                    <div key={idx} className="flex flex-col gap-3 sm:flex-row sm:items-center bg-subsurface p-3 rounded-xl border border-border">
                      <select value={link.label} onChange={(e) => changeExtra(idx, 'label', e.target.value)}
                        className="w-full sm:w-auto px-3 py-2.5 sm:py-1.5 rounded-lg border border-border bg-surface text-xs font-mono text-ink">
                        <option>LeetCode</option><option>HackerRank</option><option>Codeforces</option>
                        <option>TryHackMe</option><option>Portfolio</option><option>Other</option>
                      </select>
                      <input type="url" value={link.url} onChange={(e) => changeExtra(idx, 'url', e.target.value)} placeholder="Profile URL…"
                        className="w-full flex-1 px-3 py-2.5 sm:py-1.5 rounded-lg border border-border bg-surface text-xs text-ink" />
                      <button type="button" onClick={() => removeExtraLink(idx)} className="text-accent p-1.5 cursor-pointer self-end sm:self-auto"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">Why join? * (min 20 chars)</label>
                  <textarea required rows={4} maxLength={1000} value={aboutText} onChange={(e) => setAboutText(e.target.value)}
                    placeholder="Linux, DSA, open source, hackathons…"
                    className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink resize-none focus:outline-none focus:border-accent" />
                  <div className="text-right text-[10px] font-mono text-ink-muted mt-1">{aboutText.length} / 1000</div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#E11D48] hover:bg-[#F43F5E] !text-white text-xs font-mono font-bold uppercase tracking-wider py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer">
                  {loading ? 'Submitting…' : 'Submit Application →'}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
