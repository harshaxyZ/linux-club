'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { BackgroundGrid } from '../../components/ui/BackgroundGrid';
import { AuthGate } from '../../components/auth/AuthGate';
import {
  ArrowLeft, CheckCircle2, Plus, Trash2, Code2 as Github,
  Globe as Linkedin, AlertCircle, Terminal, LogOut, Lock, MessageCircle,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';
import { deviceHeaders } from '../../lib/device-client';
import { MultiSelectCombobox } from '../../components/ui/MultiSelectCombobox';
import {
  EXTRA_LABELS,
  MAX_LANGUAGES,
  NO_LANGUAGE,
  PROGRAMMING_LANGUAGES,
  needsLanguages,
  studentIdLabel,
} from '../../lib/form-options';
import { GITHUB_PREFIX, LINKEDIN_PREFIX } from '../../lib/handles';
import { toMobileDigits } from '../../lib/security';
import { SITE } from '../../lib/site';
import {
  BRANCH_USN_CODES,
  USN_SUFFIX_LENGTH,
  branchFromUsnCode,
  normalizeUsn,
  usnPrefix,
  validateUsn,
} from '../../lib/usn';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

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
  const [pageError, setPageError] = useState('');

  // Straight to the WhatsApp group once the submission succeeds. The short delay
  // is only so React paints the confirmation card first: that card is what the
  // applicant lands back on, and its button is the fallback for in-app webviews
  // and browsers that block scripted navigation.
  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(() => {
      window.location.assign(SITE.whatsapp);
    }, 300);
    return () => clearTimeout(timer);
  }, [submitted]);
  // Application window, read from the public settings endpoint. The server
  // enforces it too, so this is presentation only.
  const [windowClosed, setWindowClosed] = useState(false);
  const [closedMessage, setClosedMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data && data.applicationsOpen === false) {
          setWindowClosed(true);
          setClosedMessage(data.closedMessage || 'Applications are closed right now.');
        }
      })
      .catch(() => {
        // Leave the form available if the check fails; the API still enforces.
      });
    return () => {
      active = false;
    };
  }, []);

  const [fullName, setFullName] = useState('');
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');
  const [usn, setUsn] = useState('');
  const [usnSuffix, setUsnSuffix] = useState('');
  // True when the branch was selected from the USN rather than by hand.
  const [branchFromUsn, setBranchFromUsn] = useState(false);
  const [course, setCourse] = useState('');
  const [courseOther, setCourseOther] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [githubHandle, setGithubHandle] = useState('');
  const [linkedinHandle, setLinkedinHandle] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [extraLinks, setExtraLinks] = useState<ExtraLink[]>([]);
  const [aboutText, setAboutText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [consent, setConsent] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  // The college code and admission year are locked by the academic year, so the
  // student only types the branch code and roll number. First years type a plain
  // registration number into `usn` instead.
  const usnPrefixValue = useMemo(() => usnPrefix(year), [year]);
  const studentId = useMemo(
    () => (year === '1st' ? usn : `${usnPrefixValue}${usnSuffix}`),
    [year, usn, usnPrefixValue, usnSuffix]
  );

  // Live USN feedback, only once the full value is typed so the field does not
  // shout at someone mid-entry.
  const usnError = useMemo(() => {
    if (!year || year === '1st') return '';
    if (usnSuffix.length < USN_SUFFIX_LENGTH) return '';
    const check = validateUsn(studentId, year, course);
    return check.ok ? '' : check.error;
  }, [year, usnSuffix, studentId, course]);

  const loadMine = useCallback(async () => {
    try {
      const res = await fetch('/api/apply/mine');
      if (res.ok) {
        const data = await res.json();
        setExistingApp(data.application ?? null);
      }
    } catch { /* ignore */ }
  }, []);

  const prefillFromUser = useCallback((u: User) => {
    const metaName = String(u.user_metadata?.full_name ?? u.user_metadata?.name ?? '');
    if (metaName) setFullName((v) => v || metaName);
    // The API only accepts the verified sign-in address, so mirror it exactly
    // rather than letting a stale or edited value fail validation.
    if (u.email) setEmail(u.email);
  }, []);

  useEffect(() => {
    async function init() {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        // /auth/callback exchanges the code server-side and reports only a
        // coarse reason; details stay in the server logs instead of the URL.
        const err = params.get('error');
        if (err === 'exchange') {
          setPageError(
            'Google sign-in did not complete. If your browser blocks cookies, allow them for this site (in-app browsers often do not), then try again or use an email code.'
          );
        } else if (err === 'config') {
          setPageError('Sign-in is temporarily unavailable. Please try an email code or come back shortly.');
        } else if (err) {
          setPageError('Sign-in did not complete. Please try again or use an email code.');
        }
        if (err) window.history.replaceState({}, document.title, window.location.pathname);
      }
      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        // Prefill from Google profile; user can still edit everything.
        prefillFromUser(u);
        await loadMine();
      }
      setAuthChecked(true);
    }
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        prefillFromUser(u);
        // Re-check for an existing application on every sign-in (e.g. second
        // login method for the same email) instead of only on page load.
        loadMine();
      } else {
        setExistingApp(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase, loadMine, prefillFromUser]);

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
    const cleanPhone = toMobileDigits(phone);
    const idLabel = studentIdLabel(year);
    if (!fullName || !year || !section || !studentId || !course || !email || !cleanPhone || !aboutText) {
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
    if (needsLanguages(year) && languages.length === 0) {
      setErrorMsg(`First-year applicants: pick the languages you know, or "${NO_LANGUAGE}".`);
      return;
    }
    if (aboutText.trim().length < 20) {
      setErrorMsg('Tell us a bit more (min 20 characters).');
      return;
    }
    if (!consent) {
      setErrorMsg('Please tick the box to accept the Privacy Policy and Terms.');
      return;
    }
    if (!studentId.trim() || (year !== '1st' && usnSuffix.length < USN_SUFFIX_LENGTH)) {
      setErrorMsg(`${idLabel} is incomplete.`);
      return;
    }
    if (year !== '1st') {
      const check = validateUsn(studentId, year, course);
      if (!check.ok) {
        setErrorMsg(check.error);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...deviceHeaders() },
        body: JSON.stringify({
          fullName, year, section, usn: studentId,
          course: course === 'Others' ? courseOther : course,
          courseOther, email, phone: cleanPhone,
          githubHandle, linkedinHandle,
          languages: needsLanguages(year) ? languages : [],
          extraLinks, aboutText, consent,
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
          ) : windowClosed ? (
            <div className="minimal-card rounded-3xl p-8 sm:p-12 text-center shadow-2xl flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6 border border-amber-500/20">
                <Lock className="w-8 h-8" aria-hidden="true" />
              </div>
              <span className="font-mono text-xs text-amber-500 uppercase tracking-widest mb-2">{'// Registration closed'}</span>
              <h1 className="font-heading font-extrabold text-ink text-3xl sm:text-4xl tracking-tight">
                Applications are closed
              </h1>
              <p className="text-sm text-ink-muted mt-4 max-w-lg leading-relaxed">{closedMessage}</p>
              <div className="mt-8 flex flex-wrap gap-4 justify-center">
                <Link href="/" className="bg-surface hover:bg-subsurface border border-border text-ink text-xs font-mono font-semibold px-6 py-3 rounded-xl">Return Home</Link>
                <Link href="/account" className="bg-[#E11D48] !text-white text-xs font-mono font-semibold px-6 py-3 rounded-xl">My Application</Link>
              </div>
            </div>
          ) : !user ? (
            <div className="flex flex-col items-center">
              <div className="text-center mb-6">
                <span className="font-mono text-xs text-accent uppercase tracking-widest">{'// Step 1 - Sign in'}</span>
                <h1 className="font-heading font-extrabold text-ink text-3xl mt-1">Sign in to apply</h1>
                <p className="text-sm text-ink-muted mt-2">Google or an email passcode. Your name and email are prefilled after sign-in.</p>
              </div>
              {pageError && (
                <div className="mb-4 max-w-md w-full p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pageError}</span>
                </div>
              )}
              <AuthGate purpose="apply" next="apply" title="Verify account" subtitle="Prevents spam and links the application to you." />
            </div>
          ) : submitted || existingApp ? (
            <div className="minimal-card rounded-3xl p-8 sm:p-12 text-center shadow-2xl flex flex-col items-center">
              {/* Second mechanism, hoisted into <head> by React: a document-level
                  refresh still navigates in webviews that block scripted
                  navigation, where location.assign silently does nothing. */}
              {submitted && <meta httpEquiv="refresh" content={`0;url=${SITE.whatsapp}`} />}
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

              {/* Next step for every applicant: the announcements group. */}
              <a
                href={SITE.whatsapp}
                className="mt-8 inline-flex items-center gap-2 bg-[#E11D48] hover:bg-[#F43F5E] !text-white text-xs font-mono font-bold uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>Join the WhatsApp group</span>
              </a>
              {submitted && (
                <p className="mt-3 text-[11px] font-mono text-ink-muted" aria-live="polite">
                  Opening WhatsApp now. If it does not open, use the button above.
                </p>
              )}

              <p className="mt-6 text-xs font-mono text-ink-muted">Signed in as {user.email}</p>
              <div className="mt-6 flex flex-wrap gap-4 justify-center">
                <Link href="/" className="bg-surface hover:bg-subsurface border border-border text-ink text-xs font-mono font-semibold px-6 py-3 rounded-xl">Return Home</Link>
                <Link href="/account" className="bg-surface hover:bg-subsurface border border-border text-ink text-xs font-mono font-semibold px-6 py-3 rounded-xl">My Application</Link>
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
                    <span>{'// Step 2 - Application Form'}</span>
                  </div>
                  <h1 className="font-heading font-extrabold text-ink text-2xl sm:text-4xl tracking-tight">Apply for Membership</h1>
                  <p className="text-xs sm:text-sm text-ink-muted mt-2">Signed in as <span className="text-ink font-mono">{user.email}</span>. Your application is linked to this address.</p>
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
                    <label htmlFor="student-id" className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">
                      {studentIdLabel(year)} *
                    </label>
                    {year === '1st' ? (
                      <>
                        <input id="student-id" type="text" required value={usn}
                          onChange={(e) => setUsn(normalizeUsn(e.target.value).slice(0, 20))}
                          maxLength={20} autoComplete="off" spellCheck={false}
                          placeholder="College registration number"
                          aria-describedby="student-id-hint"
                          className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm font-mono text-ink uppercase focus:outline-none focus:border-accent" />
                        <p id="student-id-hint" className="mt-1.5 text-[11px] font-mono text-ink-muted">
                          First years have no USN yet, so give the registration number from your admission slip.
                        </p>
                      </>
                    ) : (
                      <>
                        {/* College code and admission year are implied by the selected
                            academic year, so they are locked rather than typed. */}
                        <div className={`flex items-stretch rounded-xl border bg-surface overflow-hidden ${
                          usnError ? 'border-amber-500/60 focus-within:border-amber-500' : 'border-border focus-within:border-accent'
                        }`}>
                          <span className="px-3 py-3.5 text-sm font-mono font-bold text-ink bg-subsurface border-r border-border select-none tracking-wider">
                            {usnPrefixValue || '1DB--'}
                          </span>
                          <input id="student-id" type="text" required
                            value={usnSuffix}
                            onChange={(e) => {
                              const next = normalizeUsn(e.target.value).slice(0, USN_SUFFIX_LENGTH);
                              setUsnSuffix(next);
                              // The USN carries the branch, so once both code
                              // letters are in, select the branch from it.
                              if (next.length >= 2) {
                                const branch = branchFromUsnCode(next.slice(0, 2));
                                if (branch && branch !== course) {
                                  setCourse(branch);
                                  setCourseOther('');
                                  setBranchFromUsn(true);
                                }
                              }
                            }}
                            maxLength={USN_SUFFIX_LENGTH}
                            disabled={!year}
                            autoComplete="off"
                            spellCheck={false}
                            placeholder={`${(BRANCH_USN_CODES[course] ?? ['CS'])[0]}001`}
                            aria-describedby="student-id-hint"
                            aria-invalid={usnError ? 'true' : undefined}
                            className="flex-1 min-w-0 px-3 py-3.5 bg-transparent text-sm font-mono text-ink uppercase tracking-wider placeholder:text-ink-muted/50 focus:outline-none disabled:opacity-60" />
                        </div>
                        <p id="student-id-hint" className={`mt-1.5 text-[11px] font-mono leading-relaxed ${usnError ? 'text-amber-500' : 'text-ink-muted'}`}>
                          {usnError
                            ? usnError
                            : !year
                              ? 'Select your academic year first: it fixes the college code and admission year.'
                              : `${usnPrefixValue} is set by your ${year} year selection. Type the last ${USN_SUFFIX_LENGTH}: branch code and roll number, e.g. ${(BRANCH_USN_CODES[course] ?? ['CS'])[0]}001. ${usnSuffix.length}/${USN_SUFFIX_LENGTH}`}
                        </p>
                      </>
                    )}
                  </div>
                  <div>
                    <label htmlFor="branch" className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">Branch *</label>
                    <select id="branch" required value={course}
                      onChange={(e) => { setCourse(e.target.value); setBranchFromUsn(false); }}
                      aria-describedby="branch-hint"
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
                    <p id="branch-hint" className="mt-1.5 text-[11px] font-mono text-ink-muted">
                      {branchFromUsn
                        ? `Filled from your USN code ${usnSuffix.slice(0, 2)}. Change it here if that is wrong.`
                        : year === '1st'
                          ? 'Pick your branch.'
                          : 'Filled automatically once you type the branch code in your USN.'}
                    </p>
                  </div>
                </div>
                {course === 'Others' && (
                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">Specify Branch *</label>
                    <input type="text" required value={courseOther} onChange={(e) => setCourseOther(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink focus:outline-none focus:border-accent" />
                  </div>
                )}
                {needsLanguages(year) && (
                  <MultiSelectCombobox
                    label="Languages you know"
                    required
                    options={PROGRAMMING_LANGUAGES}
                    selected={languages}
                    onChange={setLanguages}
                    exclusiveOption={NO_LANGUAGE}
                    maxSelected={MAX_LANGUAGES}
                    placeholder="Type to search, e.g. pyt…"
                    hint={`First years only. Type to filter, Enter to add, Backspace to remove. Pick "${NO_LANGUAGE}" if you have not started yet.`}
                  />
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">Email *</label>
                    <input type="email" required value={email} readOnly aria-readonly="true" placeholder="you@example.com"
                      aria-describedby="email-locked-hint"
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-subsurface text-sm text-ink-muted cursor-not-allowed focus:outline-none" />
                    <p id="email-locked-hint" className="mt-1.5 text-[11px] font-mono text-ink-muted">
                      Locked to your verified sign-in address. Sign in with a different account to change it.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">Phone *</label>
                    <input id="phone" type="tel" required inputMode="numeric" autoComplete="tel" maxLength={10}
                      pattern="[6-9][0-9]{9}"
                      value={phone}
                      // Refuse non-digit keystrokes outright, so nothing even appears
                      // in the field, and still normalize on change to cover paste,
                      // autofill and mobile keyboards that bypass beforeinput.
                      onBeforeInput={(e) => {
                        const data = (e.nativeEvent as InputEvent).data;
                        if (data && /\D/.test(data)) e.preventDefault();
                      }}
                      onChange={(e) => setPhone(toMobileDigits(e.target.value))}
                      placeholder="10-digit mobile"
                      aria-describedby="phone-hint"
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm font-mono text-ink focus:outline-none focus:border-accent" />
                    <p id="phone-hint" className="mt-1.5 text-[11px] font-mono text-ink-muted">
                      Digits only. A pasted +91 or 0 prefix is removed automatically. {phone.length}/10
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="github-handle" className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5" /><span>GitHub username (optional)</span>
                    </label>
                    <div className="flex items-stretch rounded-xl border border-border bg-surface focus-within:border-accent overflow-hidden">
                      <span className="px-3 py-3.5 text-xs font-mono text-ink-muted bg-subsurface border-r border-border select-none whitespace-nowrap">
                        {GITHUB_PREFIX}
                      </span>
                      <input id="github-handle" type="text" inputMode="text" autoComplete="off" spellCheck={false}
                        value={githubHandle}
                        onChange={(e) => setGithubHandle(e.target.value.replace(/\s/g, ''))}
                        placeholder="username"
                        aria-describedby="github-hint"
                        className="flex-1 min-w-0 px-3 py-3.5 bg-transparent text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none" />
                    </div>
                    <p id="github-hint" className="mt-1.5 text-[11px] font-mono text-ink-muted">
                      Username only. Letters, digits and single hyphens.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="linkedin-handle" className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Linkedin className="w-3.5 h-3.5 text-accent" /><span>LinkedIn (optional)</span>
                    </label>
                    <div className="flex items-stretch rounded-xl border border-border bg-surface focus-within:border-accent overflow-hidden">
                      <span className="px-3 py-3.5 text-xs font-mono text-ink-muted bg-subsurface border-r border-border select-none whitespace-nowrap">
                        {LINKEDIN_PREFIX}
                      </span>
                      <input id="linkedin-handle" type="text" autoComplete="off" spellCheck={false}
                        value={linkedinHandle}
                        onChange={(e) => setLinkedinHandle(e.target.value.replace(/\s/g, ''))}
                        placeholder="your-profile"
                        className="flex-1 min-w-0 px-3 py-3.5 bg-transparent text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none" />
                    </div>
                  </div>
                </div>                <div className="space-y-4 pt-2">
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
                        aria-label={`Profile type for extra link ${idx + 1}`}
                        className="w-full sm:w-auto px-3 py-2.5 sm:py-1.5 rounded-lg border border-border bg-surface text-xs font-mono text-ink">
                        {EXTRA_LABELS.map((label) => (
                          <option key={label} value={label}>{label}</option>
                        ))}
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
                <label className="flex items-start gap-2.5 text-xs text-ink-muted leading-relaxed cursor-pointer select-none bg-subsurface border border-border rounded-xl p-4">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 shrink-0 accent-[#E11D48] cursor-pointer"
                  />
                  <span>
                    I agree to the{' '}
                    <Link href="/privacy" target="_blank" className="text-accent hover:underline">Privacy Policy</Link>
                    {' '}and{' '}
                    <Link href="/terms" target="_blank" className="text-accent hover:underline">Terms &amp; Conditions</Link>
                    {' '}and consent to my details being reviewed for membership. *
                  </span>
                </label>
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
