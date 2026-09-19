'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Logo } from '../../components/ui/Logo';
import { BackgroundGrid } from '../../components/ui/BackgroundGrid';
import { AuthGate } from '../../components/auth/AuthGate';
import {
  Search, UserPlus, LogOut, Lock, AlertCircle,
  Sun, Moon, ArrowLeft, Terminal, X,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { deviceHeaders } from '../../lib/device-client';
import { useTheme } from '../../components/theme/ThemeProvider';
import { StatsPanel } from '../../components/admin/StatsPanel';
import { ApplicantDetails, type StatusFeedback } from '../../components/admin/ApplicantDetails';
import { ApplicationWindowPanel } from '../../components/admin/ApplicationWindowPanel';
import { ExportMenu } from '../../components/admin/ExportMenu';
import { studentIdLabel } from '../../lib/form-options';
import type { Application } from '../../lib/application-types';

export const dynamic = 'force-dynamic';

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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const closeDetailsRef = useRef<HTMLButtonElement | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteDone, setInviteDone] = useState(false);
  const [inviteWarning, setInviteWarning] = useState('');
  const [actionError, setActionError] = useState('');
  const [pageError, setPageError] = useState('');
  const [statsKey, setStatsKey] = useState(0);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<StatusFeedback | null>(null);

  const supabase = useMemo(() => createClient(), []);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    async function init() {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const err = params.get('error');
        if (err) {
          setPageError(
            err === 'config'
              ? 'Sign-in is temporarily unavailable. Try an email code or come back shortly.'
              : 'Google sign-in did not complete. Allow cookies for this site, then try again or use an email code.'
          );
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
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
  }, [supabase]);

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

  const openDetails = useCallback((app: Application) => {
    setSelectedApp(app);
    // Below lg there is no side panel, so the details open as a modal.
    setDetailsOpen(true);
  }, []);

  // Escape closes the modal, and focus moves to its close button when it opens.
  useEffect(() => {
    if (!detailsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetailsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    closeDetailsRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [detailsOpen]);

  const updateStatus = async (id: string, status: Application['status']) => {
    setActionError('');
    setSavingId(id);
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...deviceHeaders() },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(data.error || 'Status update failed.');
        return;
      }
      setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      if (selectedApp?.id === id) setSelectedApp({ ...selectedApp, status });
      setStatusFeedback({
        id,
        status,
        changed: data.changed !== false,
        notified: data.notified ?? 'not_applicable',
      });
      setStatsKey((k) => k + 1);
    } catch {
      setActionError('Network error.');
    } finally {
      setSavingId(null);
    }
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setActionError('');
    setInviteWarning('');
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...deviceHeaders() },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(data.error || 'Invite failed.');
      } else {
        // Access is granted even when the notification email fails.
        if (data.warning) setInviteWarning(data.warning);
        setInviteDone(true);
        setTimeout(() => {
          setInviteDone(false);
          setInviteOpen(false);
          setInviteEmail('');
        }, data.warning ? 6000 : 1500);
      }
    } catch {
      setActionError('Network error.');
    } finally {
      setInviteLoading(false);
    }
  };

  /**
   * Re-queries with the current filters and a high cap so an export is never
   * silently truncated to the tracker's page size. Returns null on failure, and
   * the menu then falls back to the rows already on screen.
   */
  const fetchAllFiltered = useCallback(async (): Promise<Application[] | null> => {
    try {
      const params = new URLSearchParams({ limit: '5000' });
      if (searchQuery) params.set('search', searchQuery);
      if (selectedYear !== 'All') params.set('year', selectedYear);
      if (selectedStatus !== 'All') params.set('status', selectedStatus);
      const res = await fetch(`/api/admin/applications?${params.toString()}`);
      if (!res.ok) return null;
      const data = await res.json().catch(() => ({}));
      return (data.applications ?? null) as Application[] | null;
    } catch {
      return null;
    }
  }, [searchQuery, selectedYear, selectedStatus]);

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
          {pageError && (
            <div className="mb-4 max-w-md w-full p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono">
              {pageError}
            </div>
          )}
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
          <p className="text-xs font-mono text-ink-muted mt-2">Signed in as {userEmail}. This account does not have reviewer access. Ask a core team member to grant it.</p>
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
            <span className="hidden md:block font-heading font-bold text-base">OSSC <span className="text-accent font-mono text-xs uppercase bg-accent/10 border border-accent/20 px-2 py-0.5 rounded ml-1">Admin</span></span>
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
        <ApplicationWindowPanel />
        <StatsPanel refreshKey={statsKey} />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 minimal-card p-6 rounded-3xl">
          <div>
            <h2 className="font-heading font-extrabold text-xl">Applicant Tracker</h2>
            <p className="text-xs font-mono text-ink-muted mt-0.5">Total: {apps.length} • {userEmail} {loading ? '• loading…' : ''}</p>
            {actionError && <p className="text-xs font-mono text-red-500 mt-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{actionError}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search name, USN/Reg No, email…"
                aria-label="Search applications by name, USN or registration number, or email"
                className="pl-9 pr-3 py-2 rounded-xl border border-border bg-surface text-xs font-mono focus:outline-none focus:border-accent" />
            </div>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-surface text-xs font-mono">
              <option value="All">All Years</option><option value="1st">1st</option><option value="2nd">2nd</option><option value="3rd">3rd</option><option value="4th">4th</option>
            </select>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-surface text-xs font-mono">
              <option value="All">All Statuses</option><option value="pending">Pending</option><option value="under_review">In Review</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option>
            </select>
            <ExportMenu
              apps={apps}
              filters={{ year: selectedYear, status: selectedStatus, search: searchQuery }}
              fetchAll={fetchAllFiltered}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 minimal-card rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <caption className="sr-only">Applications. Select a row to see full details.</caption>
                <thead className="bg-subsurface border-b border-border text-ink-muted uppercase font-mono text-[10px]">
                  <tr><th scope="col" className="p-4">Applicant</th><th scope="col" className="p-4">Branch &amp; Year</th><th scope="col" className="p-4">Status</th><th scope="col" className="p-4 text-right">Review</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {apps.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-ink-muted font-mono text-xs">No applications found.</td></tr>
                  ) : apps.map((app) => (
                    <tr key={app.id} onClick={() => openDetails(app)} className={`cursor-pointer hover:bg-subsurface/60 ${selectedApp?.id === app.id ? 'bg-accent/10' : ''}`}>
                      <td className="p-4">
                        <div className="font-semibold text-sm text-ink">{app.full_name}</div>
                        <div className="font-mono text-ink-muted text-[11px]">
                          {studentIdLabel(app.year) === 'USN' ? '' : 'Reg '}{app.usn}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-ink-muted"><div className="text-ink">{app.course}</div><div className="text-[10px]">{app.year} (Sec {app.section})</div></td>
                      <td className="p-4 font-mono">
                        {app.status === 'pending' && <span className="text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">Pending</span>}
                        {app.status === 'under_review' && <span className="text-sky-500 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full font-bold">In Review</span>}
                        {app.status === 'accepted' && <span className="text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full font-bold">Accepted</span>}
                        {app.status === 'rejected' && <span className="text-ink-muted bg-subsurface border border-border px-2 py-0.5 rounded-full font-bold">Rejected</span>}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openDetails(app); }}
                          aria-label={`View details for ${app.full_name}`}
                          className="text-accent font-mono text-xs hover:underline cursor-pointer"
                        >
                          Details →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side panel on large screens. Below that the same details open as a modal. */}
          <div className="hidden lg:block lg:col-span-5 minimal-card rounded-3xl p-6">
            {selectedApp ? (
              <ApplicantDetails app={selectedApp} onStatusChange={updateStatus} savingId={savingId} feedback={statusFeedback} />
            ) : (
              <div className="min-h-[300px] flex flex-col items-center justify-center text-ink-muted">
                <Terminal className="w-10 h-10 opacity-30 mb-3" aria-hidden="true" />
                <p className="text-xs font-mono">Select an applicant to inspect.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Details modal for tablet and phone widths, where there is no side panel. */}
      {detailsOpen && selectedApp && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center p-3 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={`Application details for ${selectedApp.full_name}`}
          onClick={() => setDetailsOpen(false)}
        >
          <div
            className="minimal-card rounded-3xl p-5 w-full max-w-lg my-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end mb-2">
              <button
                type="button"
                ref={closeDetailsRef}
                onClick={() => setDetailsOpen(false)}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-muted hover:text-ink cursor-pointer px-2 py-1"
              >
                <X className="w-4 h-4" aria-hidden="true" /><span>Close</span>
              </button>
            </div>
            <ApplicantDetails app={selectedApp} onStatusChange={updateStatus} savingId={savingId} feedback={statusFeedback} />
          </div>
        </div>
      )}

      {inviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="minimal-card rounded-3xl p-6 w-full max-w-md">
            <h3 className="font-heading font-extrabold text-xl">Add Reviewer</h3>
            <p className="text-xs text-ink-muted mt-1 mb-6">
              Grants admin console access to this email immediately and sends a notification. They must sign in
              with this exact address, using Google or an email code.
            </p>
            {inviteDone ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-mono text-center">
                  Reviewer access granted.
                </div>
                {inviteWarning && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-mono leading-relaxed">
                    {inviteWarning}
                  </div>
                )}
              </div>
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
