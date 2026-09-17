'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { BackgroundGrid } from '../../components/ui/BackgroundGrid';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Plus, Trash2, Code2 as Github, Globe as Linkedin, AlertCircle, Terminal, Lock, X, Mail, Key } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';

interface ExtraLink {
  label: string;
  url: string;
}

export default function ApplyPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Auth gate modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMethod, setAuthMethod] = useState<'google' | 'magic_link' | 'password'>('google');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMsg, setAuthMsg] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Form State
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

  const supabase = createClient();

  // Check existing session and restore pending application
  useEffect(() => {
    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
          if (session.user.user_metadata?.full_name && !fullName) {
            setFullName(session.user.user_metadata.full_name);
          }
          if (session.user.email) {
            setEmail(session.user.email);
            setAuthEmail(session.user.email);
          }

          // Check if user just returned from Google OAuth or Email Link
          const pendingDraft = sessionStorage.getItem('pending_application_draft');
          if (pendingDraft) {
            try {
              const draft = JSON.parse(pendingDraft);
              sessionStorage.removeItem('pending_application_draft');
              submitApplicationData(draft, session.user.id);
            } catch (err) {
              console.error('Draft parse error', err);
            }
          }
        }
      } catch (err) {
        console.error('Session init error', err);
      }
    }
    initSession();
  }, []);

  const addExtraLink = () => {
    if (extraLinks.length < 3) {
      setExtraLinks([...extraLinks, { label: 'LeetCode', url: '' }]);
    }
  };

  const removeExtraLink = (index: number) => {
    setExtraLinks(extraLinks.filter((_, i) => i !== index));
  };

  const handleExtraLinkChange = (index: number, field: 'label' | 'url', value: string) => {
    const updated = [...extraLinks];
    updated[index][field] = value;
    setExtraLinks(updated);
  };

  const handleUsnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsn(e.target.value.toUpperCase());
  };

  const submitApplicationData = async (formData: any, userId?: string) => {
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Submit to API for Resend notification to admin
      await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId,
        }),
      });

      // 2. Insert into Supabase table
      if (userId) {
        await supabase.from('applications').upsert({
          user_id: userId,
          full_name: formData.fullName,
          year: formData.year,
          section: formData.section,
          usn: formData.usn,
          course: formData.course,
          course_other: formData.courseOther,
          email: formData.email,
          phone: formData.phone,
          github_url: formData.githubUrl,
          linkedin_url: formData.linkedinUrl,
          extra_links: formData.extraLinks,
          about_text: formData.aboutText,
          status: 'pending',
        });
      }

      // 3. Update local tracker
      const stored = localStorage.getItem('club_applications');
      const list = stored ? JSON.parse(stored) : [];
      list.unshift({
        id: Date.now().toString(),
        full_name: formData.fullName,
        usn: formData.usn,
        year: formData.year,
        course: formData.course,
        section: formData.section,
        email: formData.email,
        phone: formData.phone,
        github_url: formData.githubUrl,
        linkedin_url: formData.linkedinUrl,
        about_text: formData.aboutText,
        status: 'pending',
        created_at: 'Just now',
      });
      localStorage.setItem('club_applications', JSON.stringify(list));

      setLoading(false);
      setShowAuthModal(false);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setLoading(false);
      setSubmitted(true);
    }
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

    const payload = {
      fullName,
      year,
      section,
      usn,
      course: course === 'Others' ? courseOther : course,
      courseOther,
      email,
      phone: cleanPhone,
      githubUrl,
      linkedinUrl,
      extraLinks,
      aboutText,
    };

    setAuthEmail(email);

    if (currentUser) {
      await submitApplicationData(payload, currentUser.id);
    } else {
      sessionStorage.setItem('pending_application_draft', JSON.stringify(payload));
      setShowAuthModal(true);
    }
  };

  const handleOAuthSignIn = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/apply` : undefined,
        },
      });

      if (error) {
        if (error.message?.includes('provider is not enabled')) {
          setAuthError('Google OAuth is pending Client ID in Supabase console. You can submit instantly with Password or Magic Link below.');
        } else {
          setAuthError(error.message);
        }
        setAuthMethod('password');
        setAuthLoading(false);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Google authentication failed');
      setAuthMethod('password');
      setAuthLoading(false);
    }
  };

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthMsg('');

    try {
      const targetEmail = authEmail || email;
      const { error } = await supabase.auth.signInWithOtp({
        email: targetEmail,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/apply` : undefined,
        },
      });

      if (error) {
        setAuthError(error.message);
      } else {
        setAuthMsg('✓ Verification link sent to your email! Click the link to complete submission.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to send verification link');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const targetEmail = authEmail || email;
      const signInRes = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: authPassword,
      });

      let authenticatedUser = signInRes.data?.user;

      if (!authenticatedUser) {
        const signupRes = await supabase.auth.signUp({
          email: targetEmail,
          password: authPassword,
          options: {
            data: { full_name: fullName },
          },
        });

        if (signupRes.error) {
          if (signupRes.error.message.toLowerCase().includes('already registered')) {
            setAuthError('Account already exists with this email. Please enter your correct password.');
            setAuthLoading(false);
            return;
          }
          setAuthError(signupRes.error.message);
          setAuthLoading(false);
          return;
        }

        authenticatedUser = signupRes.data?.user || null;
      }

      const draft = JSON.parse(sessionStorage.getItem('pending_application_draft') || '{}');
      await submitApplicationData(draft, authenticatedUser?.id);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-body text-ink relative selection:bg-rose-600 selection:text-white transition-colors duration-200">
      <BackgroundGrid />
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto">
          
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-ink-muted hover:text-ink transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 text-accent" />
            <span>Back to Home</span>
          </Link>

          {submitted ? (
            /* Confirmation Screen */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="minimal-card rounded-3xl p-8 sm:p-12 text-center shadow-2xl flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-6 border border-accent/20 shadow-lg shadow-rose-600/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <span className="font-mono text-xs text-accent uppercase tracking-widest mb-2">
                // Application Logged
              </span>

              <h1 className="font-heading font-extrabold text-ink text-3xl sm:text-4xl tracking-tight">
                Application Submitted Successfully
              </h1>

              <p className="text-sm text-ink-muted mt-4 max-w-lg leading-relaxed">
                Thank you for applying to the Linux Open Source Coding Club. The core engineering team has received your submission and will review your profile shortly.
              </p>

              <div className="mt-8 p-5 bg-subsurface border border-border rounded-xl text-xs font-mono text-ink-muted text-left w-full max-w-md space-y-2">
                <p><span className="text-ink font-semibold">Applicant:</span> {fullName}</p>
                <p><span className="text-ink font-semibold">USN:</span> {usn}</p>
                <p><span className="text-ink font-semibold">Course &amp; Year:</span> {course === 'Others' ? courseOther : course} ({year} Year)</p>
                <p><span className="text-ink font-semibold">Status:</span> <span className="text-accent font-bold uppercase">● Under Review</span></p>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/"
                  className="bg-surface hover:bg-subsurface border border-border text-ink text-xs font-mono font-semibold px-6 py-3 rounded-xl transition-all shadow-sm"
                >
                  Return to Home
                </Link>
              </div>
            </motion.div>
          ) : (
            /* Application Form */
            <div className="minimal-card rounded-3xl p-6 sm:p-10 shadow-2xl">
              
              <div className="border-b border-border pb-6 mb-8">
                <div className="flex items-center gap-2 text-xs font-mono text-accent uppercase tracking-wider mb-1">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>// Application Form</span>
                </div>
                <h1 className="font-heading font-extrabold text-ink text-2xl sm:text-4xl tracking-tight">
                  Apply for Membership
                </h1>
                <p className="text-xs sm:text-sm text-ink-muted mt-2 leading-relaxed">
                  Enter your academic and developer details below. All applications are evaluated for the upcoming cohort.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                {/* Year & Section Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">
                      Academic Year *
                    </label>
                    <select
                      name="year"
                      required
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink focus:outline-none focus:border-accent transition-colors"
                    >
                      <option value="" disabled>-- Select Academic Year --</option>
                      <option value="1st">1st Year</option>
                      <option value="2nd">2nd Year</option>
                      <option value="3rd">3rd Year</option>
                      <option value="4th">4th Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">
                      Section *
                    </label>
                    <input
                      type="text"
                      name="section"
                      required
                      value={section}
                      onChange={(e) => setSection(e.target.value.toUpperCase())}
                      placeholder="e.g. A, B, C"
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent uppercase transition-colors"
                    />
                  </div>
                </div>

                {/* USN & Course Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">
                      USN (University Serial No) *
                    </label>
                    <input
                      type="text"
                      name="usn"
                      required
                      value={usn}
                      onChange={handleUsnChange}
                      placeholder="Enter your college USN"
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm font-mono text-ink placeholder:text-ink-muted/50 uppercase focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">
                      Branch / Department *
                    </label>
                    <select
                      name="course"
                      required
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink focus:outline-none focus:border-accent transition-colors"
                    >
                      <option value="" disabled>-- Select Department / Branch --</option>
                      <option value="CSE">Computer Science &amp; Engg (CSE)</option>
                      <option value="AI ML">Artificial Intelligence &amp; ML</option>
                      <option value="AI DS">Artificial Intelligence &amp; DS</option>
                      <option value="ISE">Information Science &amp; Engg</option>
                      <option value="ECE">Electronics &amp; Comm (ECE)</option>
                      <option value="EEE">Electrical &amp; Electronics (EEE)</option>
                      <option value="IOT">IoT &amp; Cyber Security</option>
                      <option value="MECHANICAL">Mechanical Engg</option>
                      <option value="CIVIL">Civil Engg</option>
                      <option value="Others">Other Branch</option>
                    </select>
                  </div>
                </div>

                {/* Course Other (if selected) */}
                {course === 'Others' && (
                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">
                      Specify Branch / Course Name *
                    </label>
                    <input
                      type="text"
                      name="courseOther"
                      required
                      value={courseOther}
                      onChange={(e) => setCourseOther(e.target.value)}
                      placeholder="Enter your branch name"
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent"
                    />
                  </div>
                )}

                {/* Email & Phone Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="tel"
                      autoComplete="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm font-mono text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>

                {/* GitHub & LinkedIn URLs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5 text-ink" />
                      <span>GitHub Profile URL *</span>
                    </label>
                    <input
                      type="url"
                      name="github"
                      required
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Linkedin className="w-3.5 h-3.5 text-accent" />
                      <span>LinkedIn Profile (Optional)</span>
                    </label>
                    <input
                      type="url"
                      name="linkedin"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>

                {/* Extra Profiles */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-semibold text-ink uppercase tracking-wider">
                      Extra Coding Profiles (Optional, Max 3)
                    </label>
                    {extraLinks.length < 3 && (
                      <button
                        type="button"
                        onClick={addExtraLink}
                        className="inline-flex items-center gap-1 text-xs font-mono text-accent hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Link</span>
                      </button>
                    )}
                  </div>

                  {extraLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-subsurface p-3 rounded-xl border border-border">
                      <select
                        value={link.label}
                        onChange={(e) => handleExtraLinkChange(idx, 'label', e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-mono text-ink focus:outline-none"
                      >
                        <option value="LeetCode">LeetCode</option>
                        <option value="HackerRank">HackerRank</option>
                        <option value="Codeforces">Codeforces</option>
                        <option value="TryHackMe">TryHackMe</option>
                        <option value="Portfolio">Portfolio</option>
                        <option value="Other">Other</option>
                      </select>

                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => handleExtraLinkChange(idx, 'url', e.target.value)}
                        placeholder="Profile URL..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs text-ink placeholder:text-ink-muted/50 focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => removeExtraLink(idx)}
                        className="text-accent hover:text-accent/80 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Statement of Intent */}
                <div>
                  <label className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2">
                    Why do you want to join the Linux OSS Coding Club? * (~400 char max)
                  </label>
                  <textarea
                    name="about"
                    required
                    rows={4}
                    maxLength={400}
                    value={aboutText}
                    onChange={(e) => setAboutText(e.target.value)}
                    placeholder="Tell us about your interests in Linux, DSA, competitive coding, or software engineering..."
                    className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent resize-none transition-colors"
                  />
                  <div className="text-right text-[10px] font-mono text-ink-muted mt-1">
                    {aboutText.length} / 400 characters
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#E11D48] hover:bg-[#F43F5E] !text-white text-xs font-mono font-bold uppercase tracking-wider py-4 rounded-xl shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span>Processing Submission...</span>
                  ) : (
                    <span>Submit Application →</span>
                  )}
                </button>

              </form>
            </div>
          )}

        </div>
      </main>

      {/* Auth Verification Modal on Submit */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="minimal-card rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 text-ink-muted hover:text-ink p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-6 border border-accent/20">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="font-heading font-extrabold text-ink text-2xl tracking-tight">
              Verify Account to Submit
            </h3>
            <p className="text-xs text-ink-muted mt-2 mb-6 leading-relaxed">
              Verify your email to prevent spam and link your application to your student profile.
            </p>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authMsg && (
              <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-mono">
                {authMsg}
              </div>
            )}

            {/* Auth Method Tabs */}
            <div className="flex border-b border-border mb-6 font-mono text-xs">
              <button
                type="button"
                onClick={() => setAuthMethod('google')}
                className={`pb-2 flex-1 text-center font-medium transition-colors cursor-pointer ${
                  authMethod === 'google' ? 'text-ink border-b-2 border-accent' : 'text-ink-muted hover:text-ink'
                }`}
              >
                Google OAuth
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('magic_link')}
                className={`pb-2 flex-1 text-center font-medium transition-colors cursor-pointer ${
                  authMethod === 'magic_link' ? 'text-ink border-b-2 border-accent' : 'text-ink-muted hover:text-ink'
                }`}
              >
                Email Magic Link
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('password')}
                className={`pb-2 flex-1 text-center font-medium transition-colors cursor-pointer ${
                  authMethod === 'password' ? 'text-ink border-b-2 border-accent' : 'text-ink-muted hover:text-ink'
                }`}
              >
                Password
              </button>
            </div>

            {/* Tab 1: Google OAuth */}
            {authMethod === 'google' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleOAuthSignIn}
                  disabled={authLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#EDEDED] text-black font-semibold text-xs py-3.5 px-4 rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer border border-border"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{authLoading ? 'Connecting to Google...' : 'Continue with Google Account'}</span>
                </button>
              </div>
            )}

            {/* Tab 2: Email Magic Link */}
            {authMethod === 'magic_link' && (
              <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-ink-muted uppercase mb-1">
                    Your Email
                  </label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-xs text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-[#E11D48] hover:bg-[#F43F5E] !text-white font-mono font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{authLoading ? 'Sending Link...' : 'Send Magic Link →'}</span>
                </button>
              </form>
            )}

            {/* Tab 3: Password Auth */}
            {authMethod === 'password' && (
              <form onSubmit={handlePasswordAuth} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-ink-muted uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-xs text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-ink-muted uppercase mb-1">
                    Password (or create new)
                  </label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-xs text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-[#E11D48] hover:bg-[#F43F5E] !text-white font-mono font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{authLoading ? 'Authenticating...' : 'Sign In & Submit →'}</span>
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
