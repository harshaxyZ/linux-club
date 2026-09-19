'use client';

import React, { useState } from 'react';
import { Mail, Key, AlertCircle, Lock } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';
import { getOrCreateDeviceId } from '../../lib/device-client';

interface AuthGateProps {
  purpose: 'apply' | 'admin';
  title: string;
  subtitle: string;
  next: string;
}

export function AuthGate({ purpose, title, subtitle, next }: AuthGateProps) {
  const [mode, setMode] = useState<'choose' | 'email'>('choose');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [agreed, setAgreed] = useState(false);

  const supabase = createClient();

  const getDeviceId = (): string => getOrCreateDeviceId();

  const needConsent = () => {
    if (!agreed) {
      setError('Please tick the box to accept the Privacy Policy and Terms first.');
      return false;
    }
    return true;
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    if (!needConsent()) {
      setLoading(false);
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/auth/callback?next=/${next}`
              : undefined,
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
      setLoading(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    if (!needConsent()) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-id': getDeviceId() },
        body: JSON.stringify({ email, purpose }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not send code.');
      } else {
        setCodeSent(true);
        setInfo('6-digit code sent. Valid for 10 minutes.');
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'email',
      });
      if (error) {
        setError(error.message);
      }
      // onAuthStateChange in the parent picks up the session automatically
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="minimal-card rounded-3xl p-8 w-full max-w-md shadow-2xl">
      <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-6 border border-accent/20">
        <Lock className="w-6 h-6" />
      </div>
      <h3 className="font-heading font-extrabold text-ink text-2xl tracking-tight">{title}</h3>
      <p className="text-xs text-ink-muted mt-2 mb-6 leading-relaxed">{subtitle}</p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {info && (
        <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-mono">
          {info}
        </div>
      )}

      {mode === 'choose' ? (
        <div className="space-y-3">
          <label className="flex items-start gap-2.5 text-xs text-ink-muted leading-relaxed cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 shrink-0 accent-[#E11D48] cursor-pointer"
            />
            <span>
              I agree to the{' '}
              <a href="/privacy" target="_blank" rel="noreferrer" className="text-accent hover:underline">Privacy Policy</a>
              {' '}and{' '}
              <a href="/terms" target="_blank" rel="noreferrer" className="text-accent hover:underline">Terms &amp; Conditions</a>.
            </span>
          </label>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#EDEDED] text-black font-semibold text-xs py-3.5 px-4 rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer border border-border"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{loading ? 'Connecting…' : 'Continue with Google'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('email')}
            className="w-full flex items-center justify-center gap-2 bg-surface hover:bg-subsurface border border-border text-ink font-mono font-bold text-xs py-3.5 px-4 rounded-xl transition-all cursor-pointer"
          >
            <Mail className="w-4 h-4 text-accent" />
            <span>Continue with Email Code →</span>
          </button>
        </div>
      ) : !codeSent ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono text-ink-muted uppercase mb-1">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-xs text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent"
            />
          </div>
          <label className="flex items-start gap-2.5 text-xs text-ink-muted leading-relaxed cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 shrink-0 accent-[#E11D48] cursor-pointer"
            />
            <span>
              I agree to the{' '}
              <a href="/privacy" target="_blank" rel="noreferrer" className="text-accent hover:underline">Privacy Policy</a>
              {' '}and{' '}
              <a href="/terms" target="_blank" rel="noreferrer" className="text-accent hover:underline">Terms &amp; Conditions</a>.
            </span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E11D48] hover:bg-[#F43F5E] !text-white font-mono font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{loading ? 'Sending…' : 'Send 6-Digit Code →'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('choose')}
            className="w-full text-xs font-mono text-ink-muted hover:text-ink cursor-pointer"
          >
            ← Back
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono text-ink-muted uppercase mb-1">
              6-digit code sent to {email}
            </label>
            <input
              type="text"
              required
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm font-mono tracking-[0.5em] text-center text-ink focus:outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E11D48] hover:bg-[#F43F5E] !text-white font-mono font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{loading ? 'Verifying…' : 'Verify & Continue →'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCodeSent(false);
              setCode('');
            }}
            className="w-full text-xs font-mono text-ink-muted hover:text-ink cursor-pointer"
          >
            ← Use a different email
          </button>
        </form>
      )}
    </div>
  );
}
