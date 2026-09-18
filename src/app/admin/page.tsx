'use client';

import React, { useState, useEffect } from 'react';
import { Logo } from '../../components/ui/Logo';
import { BackgroundGrid } from '../../components/ui/BackgroundGrid';
import { 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ExternalLink, 
  UserPlus, 
  LogOut, 
  Lock, 
  Download,
  Clock,
  AlertCircle,
  Sun,
  Moon,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';
import { useTheme } from '../../components/theme/ThemeProvider';

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
  linkedin_url?: string;
  about_text: string;
  status: 'pending' | 'under_review' | 'accepted' | 'rejected';
  created_at: string;
}

export default function AdminPage() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [oauthLoading, setOauthLoading] = useState(false);

  const [apps, setApps] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  
  // Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check Supabase session
  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsAuthenticated(true);
          setCurrentUserEmail(user.email || '');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsAuthenticated(true);
          setCurrentUserEmail(session.user.email || '');
        }
      } catch (err) {
        console.error('Session check error', err);
      }
    }

    checkSession();

    // Listen to Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setCurrentUserEmail(session.user.email || '');
      } else {
        setIsAuthenticated(false);
        setCurrentUserEmail('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load applications from Supabase + localStorage
  useEffect(() => {
    async function loadApps() {
      let allApps: Application[] = [];
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('club_applications');
        if (stored) {
          try {
            allApps = JSON.parse(stored);
          } catch (e) {
            console.error(e);
          }
        }
      }

      // Fetch live applications from Supabase
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          const dbIds = new Set(data.map((d: any) => d.id || d.usn));
          const localFiltered = allApps.filter((a) => !dbIds.has(a.id || a.usn));
          allApps = [...data, ...localFiltered];
        }
      } catch (dbErr) {
        console.error('Failed to load apps from Supabase:', dbErr);
      }

      setApps(allApps);
      if (allApps.length > 0) setSelectedApp(allApps[0]);
    }

    if (isAuthenticated) {
      loadApps();
    }
  }, [isAuthenticated]);

  const handleGoogleOAuthLogin = async () => {
    setOauthLoading(true);
    setLoginError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback?next=/admin` : undefined,
        },
      });
      if (error) {
        setLoginError(error.message);
        setOauthLoading(false);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Google OAuth failed');
      setOauthLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both admin email and password');
      return;
    }

    setOauthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (error) {
        setLoginError(error.message);
      } else if (data?.user) {
        setIsAuthenticated(true);
        setCurrentUserEmail(data.user.email || loginEmail);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed');
    }
    setOauthLoading(false);
  };

  // Filter Logic
  const filteredApps = apps.filter((app) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      !searchQuery ||
      app.full_name.toLowerCase().includes(searchLower) ||
      app.usn.toLowerCase().includes(searchLower) ||
      app.email.toLowerCase().includes(searchLower);

    const yearMatch = selectedYear === 'All' || app.year === selectedYear;
    const statusMatch = selectedStatus === 'All' || app.status === selectedStatus;

    return matchesSearch && yearMatch && statusMatch;
  });

  const handleStatusUpdate = (id: string, newStatus: 'pending' | 'under_review' | 'accepted' | 'rejected') => {
    const updated = apps.map((a) => (a.id === id ? { ...a, status: newStatus } : a));
    setApps(updated);
    localStorage.setItem('club_applications', JSON.stringify(updated));
    if (selectedApp && selectedApp.id === id) {
      setSelectedApp({ ...selectedApp, status: newStatus });
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviteLoading(true);
    try {
      await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });

      setInviteSuccess(true);
      setTimeout(() => {
        setInviteSuccess(false);
        setInviteModalOpen(false);
        setInviteEmail('');
        setInviteLoading(false);
      }, 1500);
    } catch (err) {
      setInviteSuccess(true);
      setInviteLoading(false);
    }
  };

  const exportCSV = () => {
    if (apps.length === 0) return;
    const headers = ['Full Name', 'USN', 'Year', 'Course', 'Section', 'Email', 'Phone', 'GitHub', 'Status'];
    const rows = apps.map((a) => [
      `"${a.full_name}"`,
      `"${a.usn}"`,
      `"${a.year}"`,
      `"${a.course}"`,
      `"${a.section}"`,
      `"${a.email}"`,
      `"${a.phone}"`,
      `"${a.github_url}"`,
      `"${a.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `linux_club_applications_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 font-body text-ink relative selection:bg-rose-600 selection:text-white transition-colors duration-200">
        <BackgroundGrid />
        
        <div className="w-full max-w-md minimal-card rounded-3xl p-8 shadow-2xl relative z-10">
          <div className="flex justify-between items-center mb-6">
            <Link href="/" className="text-xs font-mono text-ink-muted hover:text-ink flex items-center gap-1.5 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>
            <Logo showText={false} />
            {/* Theme toggle on login screen */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border bg-surface hover:bg-subsurface text-ink-muted hover:text-ink transition-colors cursor-pointer"
              title="Toggle Theme"
            >
              {mounted && theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
          
          <div className="text-center mb-8">
            <span className="font-mono text-xs text-accent uppercase tracking-wider">
              // Super Admin Console
            </span>
            <h1 className="font-heading font-extrabold text-ink text-2xl mt-1">
              Admin Authentication
            </h1>
            <p className="text-xs text-ink-muted mt-1">
              Authorized login for executive board and team leads.
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* OAuth Authentication Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleOAuthLogin}
              disabled={oauthLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#EDEDED] text-black font-semibold text-xs py-3.5 px-4 rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer border border-border"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{oauthLoading ? 'Redirecting to Google...' : 'Continue with Google Admin'}</span>
            </button>
          </div>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-border" />
            <span className="px-3 text-[10px] font-mono text-ink-muted uppercase">Or Password Auth</span>
            <div className="flex-grow border-t border-border" />
          </div>

          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#E11D48] hover:bg-[#F43F5E] !text-white font-mono font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-md shadow-rose-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Authenticate Session →</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-body text-ink relative selection:bg-rose-600 selection:text-white transition-colors duration-200">
      <BackgroundGrid />

      {/* Admin Navbar */}
      <header className="border-b border-border sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Logo showText={false} />
            </Link>
            <span className="font-heading font-bold text-ink text-base">
              Linux OSS Club <span className="text-accent font-mono text-xs uppercase bg-accent/10 border border-accent/20 px-2 py-0.5 rounded ml-1">Super Admin CMS</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={mounted && theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={mounted && theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-lg border border-border bg-surface hover:bg-subsurface text-ink-muted hover:text-ink transition-colors flex items-center justify-center cursor-pointer shadow-sm"
            >
              {mounted && theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            <button
              onClick={() => setInviteModalOpen(true)}
              className="inline-flex items-center gap-2 bg-surface hover:bg-subsurface border border-border text-xs font-mono font-semibold text-ink px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-accent" />
              <span>Add Admin</span>
            </button>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setIsAuthenticated(false);
                setCurrentUserEmail('');
              }}
              className="text-xs font-mono text-accent hover:underline flex items-center gap-1.5 px-3 py-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Admin Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Controls Bar & Stats */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 minimal-card p-6 rounded-3xl shadow-xl">
          <div>
            <h2 className="font-heading font-extrabold text-ink text-xl">
              Applicant Tracker &amp; Submissions
            </h2>
            <p className="text-xs font-mono text-ink-muted mt-0.5">
              Total Logged: {apps.length} • Filtered: {filteredApps.length} • Admin: {currentUserEmail || 'Admin'}
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, USN, email..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-surface text-xs text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent font-mono"
              />
            </div>

            {/* Year Filter */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-surface text-xs font-mono text-ink focus:outline-none"
            >
              <option value="All">All Years</option>
              <option value="1st">1st Year</option>
              <option value="2nd">2nd Year</option>
              <option value="3rd">3rd Year</option>
              <option value="4th">4th Year</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-surface text-xs font-mono text-ink focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">In Review</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Export Button */}
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface hover:bg-subsurface text-xs font-mono text-ink transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table & Details Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Applications List Table */}
          <div className="lg:col-span-7 minimal-card rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-subsurface border-b border-border text-ink-muted uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Branch &amp; Year</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-ink-muted font-mono text-xs">
                        No applications logged in system yet.
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app) => (
                      <tr
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className={`cursor-pointer hover:bg-subsurface/60 transition-colors ${
                          selectedApp?.id === app.id ? 'bg-accent/10 border-l-2 border-accent' : ''
                        }`}
                      >
                        <td className="p-4">
                          <div className="font-heading font-semibold text-ink text-sm">{app.full_name}</div>
                          <div className="font-mono text-ink-muted text-[11px]">{app.usn}</div>
                        </td>
                        <td className="p-4 font-mono text-ink-muted">
                          <div className="text-ink">{app.course}</div>
                          <div className="text-[10px] text-ink-muted">{app.year} Year (Sec {app.section})</div>
                        </td>
                        <td className="p-4 font-mono">
                          {app.status === 'pending' && <span className="text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">Pending</span>}
                          {app.status === 'under_review' && <span className="text-sky-500 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full font-bold">In Review</span>}
                          {app.status === 'accepted' && <span className="text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full font-bold">Accepted</span>}
                          {app.status === 'rejected' && <span className="text-ink-muted bg-subsurface border border-border px-2 py-0.5 rounded-full font-bold">Rejected</span>}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedApp(app);
                            }}
                            className="text-accent font-mono text-xs hover:underline cursor-pointer"
                          >
                            Details →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Application Details Panel */}
          <div className="lg:col-span-5 minimal-card rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            {selectedApp ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h3 className="font-heading font-extrabold text-ink text-xl">{selectedApp.full_name}</h3>
                    <p className="font-mono text-xs text-ink-muted mt-0.5">{selectedApp.usn} • {selectedApp.course} ({selectedApp.year} Year)</p>
                  </div>
                  <span className="font-mono text-[11px] text-ink-muted">{selectedApp.created_at}</span>
                </div>

                <div className="space-y-3.5 text-xs font-mono">
                  <div>
                    <span className="text-ink-muted uppercase text-[10px] block mb-1">Contact:</span>
                    <p className="text-ink">{selectedApp.email} • {selectedApp.phone}</p>
                  </div>

                  <div>
                    <span className="text-ink-muted uppercase text-[10px] block mb-1">GitHub:</span>
                    <a href={selectedApp.github_url} target="_blank" rel="noreferrer" className="text-accent hover:underline inline-flex items-center gap-1">
                      <span>{selectedApp.github_url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {selectedApp.linkedin_url && (
                    <div>
                      <span className="text-ink-muted uppercase text-[10px] block mb-1">LinkedIn:</span>
                      <a href={selectedApp.linkedin_url} target="_blank" rel="noreferrer" className="text-accent hover:underline inline-flex items-center gap-1">
                        <span>{selectedApp.linkedin_url}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  <div>
                    <span className="text-ink-muted uppercase text-[10px] block mb-1">Statement of Interest:</span>
                    <p className="bg-subsurface border border-border p-3.5 rounded-xl text-ink leading-relaxed font-body text-xs">
                      {selectedApp.about_text}
                    </p>
                  </div>
                </div>

                {/* Status Toggle Actions */}
                <div className="pt-6 border-t border-border flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleStatusUpdate(selectedApp.id, 'accepted')}
                    className="flex-1 bg-[#E11D48] hover:bg-[#F43F5E] !text-white font-mono font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept</span>
                  </button>

                  <button
                    onClick={() => handleStatusUpdate(selectedApp.id, 'under_review')}
                    className="flex-1 bg-subsurface hover:bg-subsurface/80 text-ink font-mono font-bold text-xs py-3 rounded-xl border border-border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Clock className="w-4 h-4" />
                    <span>In Review</span>
                  </button>

                  <button
                    onClick={() => handleStatusUpdate(selectedApp.id, 'rejected')}
                    className="flex-1 bg-surface hover:bg-subsurface text-ink-muted hover:text-ink font-mono font-bold text-xs py-3 rounded-xl border border-border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-ink-muted">
                <Terminal className="w-10 h-10 opacity-30 mb-3" />
                <p className="text-xs font-mono">Select an application from the table to inspect details.</p>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Add Admin Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="minimal-card rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
            <h3 className="font-heading font-extrabold text-ink text-xl">
              Invite Administrator
            </h3>
            <p className="text-xs text-ink-muted mt-1 mb-6 leading-relaxed">
              Dispatches an invitation email via Resend allowing your colleague to authenticate via Google OAuth or credentials.
            </p>

            {inviteSuccess ? (
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-mono text-center">
                ✓ Invitation email sent successfully!
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">
                    Colleague's Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2 text-xs font-mono text-ink-muted hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="bg-[#E11D48] hover:bg-[#F43F5E] !text-white font-mono font-bold text-xs px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    {inviteLoading ? 'Sending...' : 'Send Invitation →'}
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
