'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CalendarClock, Lock, Unlock } from 'lucide-react';
import { deviceHeaders } from '../../lib/device-client';

interface Settings {
  applicationsOpen: boolean;
  accepting: boolean;
  closedMessage: string | null;
  closesAt: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

/** `datetime-local` wants a local "YYYY-MM-DDTHH:mm" string, not an ISO instant. */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ApplicationWindowPanel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [message, setMessage] = useState('');
  const [deadline, setDeadline] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not load settings.');
        return;
      }
      setSettings(data as Settings);
      setMessage((data as Settings).closedMessage ?? '');
      setDeadline(toLocalInput((data as Settings).closesAt));
    } catch {
      setError('Network error while loading settings.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (patch: Record<string, unknown>, label: string) => {
    setBusy(true);
    setError('');
    setSaved('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...deviceHeaders() },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not save.');
        return;
      }
      setSettings(data as Settings);
      setMessage((data as Settings).closedMessage ?? '');
      setDeadline(toLocalInput((data as Settings).closesAt));
      setSaved(label);
      setTimeout(() => setSaved(''), 2500);
    } catch {
      setError('Network error while saving.');
    } finally {
      setBusy(false);
    }
  };

  const accepting = settings?.accepting ?? true;

  return (
    <section aria-labelledby="window-heading" className="minimal-card rounded-3xl p-6 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {accepting ? (
            <Unlock className="w-4 h-4 text-accent" aria-hidden="true" />
          ) : (
            <Lock className="w-4 h-4 text-amber-500" aria-hidden="true" />
          )}
          <h3 id="window-heading" className="font-heading font-extrabold text-lg">Application window</h3>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
            accepting
              ? 'text-accent bg-accent/10 border-accent/20'
              : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
          }`}
        >
          {accepting ? 'OPEN, accepting applications' : 'CLOSED to new applications'}
        </span>
      </div>

      {error && (
        <p className="mb-4 text-xs font-mono text-red-500 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      {saved && (
        <p className="mb-4 text-xs font-mono text-accent">{saved}</p>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 space-y-3">
          <button
            type="button"
            disabled={busy || !settings}
            onClick={() =>
              save(
                { applicationsOpen: !(settings?.applicationsOpen ?? true) },
                settings?.applicationsOpen ? 'Applications closed.' : 'Applications opened.'
              )
            }
            className={`w-full inline-flex items-center justify-center gap-2 font-mono font-bold text-xs py-3 rounded-xl cursor-pointer disabled:opacity-50 ${
              settings?.applicationsOpen
                ? 'bg-surface border border-border text-ink'
                : 'bg-accent !text-accent-contrast'
            }`}
          >
            {settings?.applicationsOpen ? (
              <><Lock className="w-4 h-4" aria-hidden="true" /><span>Close applications</span></>
            ) : (
              <><Unlock className="w-4 h-4" aria-hidden="true" /><span>Open applications</span></>
            )}
          </button>
          <p className="text-[11px] font-mono text-ink-muted leading-relaxed">
            Closing hides the form and rejects new submissions server-side. Existing applicants keep
            access to their record.
            {settings?.updatedBy ? ` Last changed by ${settings.updatedBy}.` : ''}
          </p>
        </div>

        <div className="flex-1 space-y-3">
          <label htmlFor="closes-at" className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted">
            <CalendarClock className="w-3 h-3 inline mr-1" aria-hidden="true" />
            Auto-close deadline (optional)
          </label>
          <div className="flex gap-2">
            <input
              id="closes-at"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-border bg-surface text-xs font-mono text-ink focus:outline-none focus:border-accent"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => save({ closesAt: deadline ? new Date(deadline).toISOString() : '' }, 'Deadline saved.')}
              className="px-3 py-2.5 rounded-xl border border-border bg-surface text-xs font-mono cursor-pointer disabled:opacity-50"
            >
              Save
            </button>
          </div>
          <p className="text-[11px] font-mono text-ink-muted">
            {settings?.closesAt
              ? `Closes ${new Date(settings.closesAt).toLocaleString()}. Clear the field and save to remove.`
              : 'No deadline set. Applications stay open until closed manually.'}
          </p>
        </div>

        <div className="flex-1 space-y-3">
          <label htmlFor="closed-message" className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted">
            Message shown when closed
          </label>
          <textarea
            id="closed-message"
            rows={3}
            maxLength={300}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Applications are closed right now. Follow the Discord for the next drive."
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-xs text-ink resize-none focus:outline-none focus:border-accent"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => save({ closedMessage: message }, 'Message saved.')}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-xs font-mono cursor-pointer disabled:opacity-50"
          >
            Save message
          </button>
        </div>
      </div>
    </section>
  );
}
