'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Logo } from '../../components/ui/Logo';
import { BackgroundGrid } from '../../components/ui/BackgroundGrid';
import { AuthGate } from '../../components/auth/AuthGate';
import {
  CheckCircle2, XCircle, Search, ExternalLink, UserPlus,
  LogOut, Lock, Download, Clock, AlertCircle, Sun, Moon, ArrowLeft, Terminal,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';
import { deviceHeaders } from '../../lib/device-client';
import { useTheme } from '../../components/theme/ThemeProvider';

export const dynamic = 'force-dynamic';

interface Application {
  id: string;
  full_name: string;
  usn: string;
  year: string;
  course: string;
  section: string;
  email: string;
  phone: string;
  github_url: string;
  linkedin_url?: string | null;
  extra_links?: Array<{ label: string; url: string }> | null;
  about_text: string;
  status: 'pending' | 'under_review' | 'accepted' | 'rejected';
  created_at: string;
}

export default function AdminPage() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteDone, setInviteDone] = useState(false);
  const [actionError, setActionError] = useState('');

  const supabase = useMemo(() => createClient(), []);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user;
      setAuthed(!!u);
      setUserEmail(u?.email ?? '');
      if (u) {
        try {
          const res = await fetch('/api/admin/check');
          setIsAdmin(res.ok);
        } catch {
          setIsAdmin(false);
        }
      }
      setAdminChecked(true);
    }
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const u = session?.user;
      setAuthed(!!u);
      setUserEmail(u?.email ?? '');
      if (u) {
        try {
          const res = await fetch('/api/admin/check');
          setIsAdmin(res.ok);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setAdminChecked(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadApps = useCallback(async () => {
    setLoading(true);
    setActionError('');
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedYear !== 'All') params.set('year', selectedYear);
      if (selectedStatus !== 'All') params.set('status', selectedStatus);
      const res = await fetch(`/api/admin/applications?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(data.error || 'Could not load applications.');
        setApps([]);
      } else {
        setApps(data.applications ?? []);
        if (data.applications?.length > 0) setSelectedApp((cur) => cur ?? data.applications[0]);
      }
    } catch {
      setActionError('Network error.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedYear, selectedStatus]);

  useEffect(() => {
    if (authed && isAdmin) loadApps();
  }, [authed, isAdmin, loadApps]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (authed && isAdmin) loadApps();
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery, selectedYear, selectedStatus, authed, isAdmin, loadApps]);

  const updateStatus = async (id: string, status: Application['status']) => {
    setActionError('');
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...deviceHeaders() },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        setActionError('Status update failed.');
        return;
      }
      setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      if (selectedApp?.id === id) setSelectedApp({ ...selectedApp, status });
    } catch {
      setActionError('Network error.');
    }
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...deviceHeaders() },
        body: JSON.stringify({ email: inviteEmail }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || 'Invite failed.');
      } else {
        setInviteDone(true);
        setTimeout(() => {
          setInviteDone(false);
          setInviteOpen(false);
          setInviteEmail('');
        }, 1500);
      }
    } catch {
      setActionError('Network error.');
    } finally {
      setInviteLoading(false);
    }
  };

  const exportCSV = () => {
    if (apps.length === 0) return;
    const headers = ['Full Name', 'USN', 'Year', 'Course', 'Section', 'Email', 'Phone', 'GitHub', 'Status'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = apps.map((a) => [a.full_name, a.usn, a.year, a.course, a.section, a.email, a.phone, a.github_url, a.status].map(esc));
    const blob = new Blob([[headers.map(esc).join(','), ...rows.map((r) => r.join(','))].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `loss_applications_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!adminChecked) {
    return <div className="min-h-screen flex items-center justify-center font-mono text-xs text-ink-muted">Checking session…</div>;
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
        <BackgroundGrid />
        <div className="relative z-10 flex flex-col items-center">
          <Link href="/" className="mb-6 text-xs font-mono text-ink-muted hover:text-ink flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /><span>Back</span>
          </Link>
          <AuthGate purpose="admin" next="admin" title="Admin sign-in"
            subtitle="Google or email code. Only allowlisted admin emails can proceed." />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
        <BackgroundGrid />
        <div className="minimal-card rounded-3xl p-8 max-w-md text-center relative z-10">
          <Lock className="w-8 h-8 text-accent mx-auto mb-4" />
          <h1 className="font-heading font-extrabold text-xl text-ink">Access denied</h1>
          <p className="text-xs font-mono text-ink-muted mt-2">Signed in as {userEmail}. This address is not an admin. Ask to be added to ADMIN_EMAILS.</p>
          <button onClick={async () => { await supabase.auth.signOut(); }} className="mt-6 text-xs font-mono text-accent hover:underline cursor-pointer inline-flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-body text-ink relative">
      <BackgroundGrid />
      <header className="border-b border-border sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/"><Logo showText={false} /></Link>
            <span className="hidden md:block font-heading font-bold text-base">Linux OSS Club <span className="text-accent font-mono text-xs uppercase bg-accent/10 border border-accent/20 px-2 py-0.5 rounded ml-1">Admin</span></span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <button type="button" onClick={toggleTheme} className="p-2 rounded-lg border border-border bg-surface text-ink-muted cursor-pointer" aria-label="Toggle theme">
              {mounted && theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
            <button onClick={() => setInviteOpen(true)} className="inline-flex items-center gap-2 bg-surface border border-border text-xs font-mono font-semibold px-3 sm:px-3.5 py-2 rounded-xl cursor-pointer">
              <UserPlus className="w-3.5 h-3.5 text-accent" /><span className="hidden sm:inline">Add Admin</span>
            </button>
            <button onClick={async () => { await supabase.auth.signOut(); }} className="text-xs font-mono text-accent hover:underline flex items-center gap-1.5 px-2 sm:px-3 py-2 cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 minimal-card p-6 rounded-3xl">
          <div>
            <h2 className="font-heading font-extrabold text-xl">Applicant Tracker</h2>
            <p className="text-xs font-mono text-ink-muted mt-0.5">Total: {apps.length} • {userEmail} {loading ? '• loading…' : ''}</p>
            {actionError && <p className="text-xs font-mono text-red-500 mt-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{actionError}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search name, USN, email…"
                className="pl-9 pr-3 py-2 rounded-xl border border-border bg-surface text-xs font-mono focus:outline-none focus:border-accent" />
            </div>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-surface text-xs font-mono">
              <option value="All">All Years</option><option value="1st">1st</option><option value="2nd">2nd</option><option value="3rd">3rd</option><option value="4th">4th</option>
            </select>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-surface text-xs font-mono">
              <option value="All">All Statuses</option><option value="pending">Pending</option><option value="under_review">In Review</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option>
            </select>
            <button onClick={exportCSV} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface text-xs font-mono cursor-pointer">
              <Download className="w-3.5 h-3.5 text-accent" /><span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 minimal-card rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-xs">
                <thead className="bg-subsurface border-b border-border text-ink-muted uppercase font-mono text-[10px]">
                  <tr><th className="p-4">Student</th><th className="p-4">Branch &amp; Year</th><th className="p-4">Status</th><th className="p-4 text-right">Review</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {apps.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-ink-muted font-mono text-xs">No applications found.</td></tr>
                  ) : apps.map((app) => (
                    <tr key={app.id} onClick={() => setSelectedApp(app)} className={`cursor-pointer hover:bg-subsurface/60 ${selectedApp?.id === app.id ? 'bg-accent/10' : ''}`}>
                      <td className="p-4"><div className="font-semibold text-sm">{app.full_name}</div><div className="font-mono text-ink-muted text-[11px]">{app.usn}</div></td>
                      <td className="p-4 font-mono text-ink-muted"><div className="text-ink">{app.course}</div><div className="text-[10px]">{app.year} (Sec {app.section})</div></td>
                      <td className="p-4 font-mono">
                        {app.status === 'pending' && <span className="text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">Pending</span>}
                        {app.status === 'under_review' && <span className="text-sky-500 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full font-bold">In Review</span>}
                        {app.status === 'accepted' && <span className="text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full font-bold">Accepted</span>}
                        {app.status === 'rejected' && <span className="text-ink-muted bg-subsurface border border-border px-2 py-0.5 rounded-full font-bold">Rejected</span>}
                      </td>
                      <td className="p-4 text-right"><button onClick={(e) => { e.stopPropagation(); setSelectedApp(app); }} className="text-accent font-mono text-xs hover:underline cursor-pointer">Details →</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-5 minimal-card rounded-3xl p-6">
            {selectedApp ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h3 className="font-heading font-extrabold text-xl">{selectedApp.full_name}</h3>
                    <p className="font-mono text-xs text-ink-muted mt-0.5">{selectedApp.usn} • {selectedApp.course} ({selectedApp.year})</p>
                  </div>
                </div>
                <div className="space-y-3.5 text-xs font-mono">
                  <div><span className="text-ink-muted uppercase text-[10px] block mb-1">Contact</span><p className="text-ink">{selectedApp.email} • {selectedApp.phone}</p></div>
                  <div><span className="text-ink-muted uppercase text-[10px] block mb-1">GitHub</span>
                    <a href={selectedApp.github_url} target="_blank" rel="noreferrer" className="text-accent hover:underline inline-flex items-center gap-1"><span className="break-all">{selectedApp.github_url}</span><ExternalLink className="w-3 h-3 shrink-0" /></a></div>
                  {selectedApp.linkedin_url && (
                    <div><span className="text-ink-muted uppercase text-[10px] block mb-1">LinkedIn</span>
                      <a href={selectedApp.linkedin_url} target="_blank" rel="noreferrer" className="text-accent hover:underline inline-flex items-center gap-1"><span className="break-all">{selectedApp.linkedin_url}</span><ExternalLink className="w-3 h-3 shrink-0" /></a></div>
                  )}
                  {selectedApp.extra_links && selectedApp.extra_links.length > 0 && (
                    <div><span className="text-ink-muted uppercase text-[10px] block mb-1">Extra profiles</span>
                      {selectedApp.extra_links.map((l, i) => l.url && (
                        <a key={i} href={l.url} target="_blank" rel="noreferrer" className="text-accent hover:underline block">{l.label}: {l.url}</a>
                      ))}
                    </div>
                  )}
                  <div><span className="text-ink-muted uppercase text-[10px] block mb-1">Statement</span>
                    <p className="bg-subsurface border border-border p-3.5 rounded-xl text-ink font-body">{selectedApp.about_text}</p></div>
                </div>
                <div className="pt-6 border-t border-border flex flex-wrap gap-2">
                  <button onClick={() => updateStatus(selectedApp.id, 'accepted')} className="flex-1 bg-[#E11D48] !text-white font-mono font-bold text-xs py-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /><span>Accept</span>
                  </button>
                  <button onClick={() => updateStatus(selectedApp.id, 'under_review')} className="flex-1 bg-subsurface font-mono font-bold text-xs py-3 rounded-xl border border-border cursor-pointer flex items-center justify-center gap-1.5">
                    <Clock className="w-4 h-4" /><span>In Review</span>
                  </button>
                  <button onClick={() => updateStatus(selectedApp.id, 'rejected')} className="flex-1 bg-surface text-ink-muted font-mono font-bold text-xs py-3 rounded-xl border border-border cursor-pointer flex items-center justify-center gap-1.5">
                    <XCircle className="w-4 h-4" /><span>Reject</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="min-h-[300px] flex flex-col items-center justify-center text-ink-muted">
                <Terminal className="w-10 h-10 opacity-30 mb-3" />
                <p className="text-xs font-mono">Select an application to inspect.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="minimal-card rounded-3xl p-6 w-full max-w-md">
            <h3 className="font-heading font-extrabold text-xl">Invite Administrator</h3>
            <p className="text-xs text-ink-muted mt-1 mb-6">Sends a sign-in link via Resend (Brevo fallback). Permanent access still needs ADMIN_EMAILS.</p>
            {inviteDone ? (
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-mono text-center">Invitation sent.</div>
            ) : (
              <form onSubmit={sendInvite} className="space-y-4">
                <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@example.com"
                  className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm" />
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button type="button" onClick={() => setInviteOpen(false)} className="px-4 py-2 text-xs font-mono text-ink-muted cursor-pointer">Cancel</button>
                  <button type="submit" disabled={inviteLoading} className="bg-[#E11D48] !text-white font-mono font-bold text-xs px-5 py-2.5 rounded-xl disabled:opacity-50 cursor-pointer">
                    {inviteLoading ? 'Sending…' : 'Send Invitation →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
