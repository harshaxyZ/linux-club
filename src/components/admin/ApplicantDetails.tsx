'use client';

import React from 'react';
import { CheckCircle2, Clock, ExternalLink, Loader2, Mail, MailX, XCircle } from 'lucide-react';
import type { Application, ApplicationStatus } from '../../lib/application-types';
import { studentIdLabel } from '../../lib/form-options';
import { GithubStats } from './GithubStats';

export interface StatusFeedback {
  id: string;
  status: ApplicationStatus;
  notified: 'sent' | 'failed' | 'not_applicable';
  changed: boolean;
}

interface ApplicantDetailsProps {
  app: Application;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  /** Id currently being saved, so the pressed button can show progress. */
  savingId?: string | null;
  feedback?: StatusFeedback | null;
}

const STATUS_META: Record<ApplicationStatus, { label: string; chip: string }> = {
  pending: { label: 'Pending', chip: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  under_review: { label: 'In review', chip: 'text-sky-500 bg-sky-500/10 border-sky-500/20' },
  accepted: { label: 'Accepted', chip: 'text-accent bg-accent/10 border-accent/20' },
  rejected: { label: 'Rejected', chip: 'text-ink-muted bg-subsurface border-border' },
};

/**
 * Decision buttons. The current status is filled, ringed, marked
 * aria-pressed and disabled, so a reviewer can tell at a glance what a record is
 * set to: previously all three looked identical whatever the status.
 */
function StatusButton({
  target,
  current,
  saving,
  onClick,
  children,
  activeClass,
}: {
  target: ApplicationStatus;
  current: ApplicationStatus;
  saving: boolean;
  onClick: () => void;
  children: React.ReactNode;
  activeClass: string;
}) {
  const isCurrent = current === target;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isCurrent || saving}
      aria-pressed={isCurrent}
      title={isCurrent ? `Already ${STATUS_META[target].label.toLowerCase()}` : `Set to ${STATUS_META[target].label.toLowerCase()}`}
      className={`flex-1 font-mono font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
        isCurrent
          ? `${activeClass} ring-2 ring-offset-2 ring-offset-background cursor-default`
          : 'bg-surface border border-border text-ink-muted hover:text-ink cursor-pointer'
      } ${saving && !isCurrent ? 'opacity-50' : ''}`}
    >
      {children}
      {isCurrent && <span className="text-[10px] opacity-80">(current)</span>}
    </button>
  );
}

export function ApplicantDetails({ app, onStatusChange, savingId, feedback }: ApplicantDetailsProps) {
  const saving = savingId === app.id;
  const meta = STATUS_META[app.status];
  const showFeedback = feedback && feedback.id === app.id;

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading font-extrabold text-xl">{app.full_name}</h3>
            <p className="font-mono text-xs text-ink-muted mt-0.5">
              {app.usn} • {app.course} ({app.year}, Sec {app.section})
            </p>
            <p className="font-mono text-[11px] text-ink-muted mt-1">
              Applied {new Date(app.created_at).toLocaleString()}
            </p>
          </div>
          <span
            aria-live="polite"
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-mono font-bold border ${meta.chip}`}
          >
            {saving ? 'Saving…' : meta.label}
          </span>
        </div>

        {showFeedback && !saving && (
          <p
            className={`mt-3 text-[11px] font-mono flex items-start gap-1.5 ${
              feedback.notified === 'failed' ? 'text-amber-500' : 'text-accent'
            }`}
          >
            {feedback.notified === 'sent' && <Mail className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />}
            {feedback.notified === 'failed' && <MailX className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />}
            <span>
              {!feedback.changed
                ? `Already ${STATUS_META[feedback.status].label.toLowerCase()}, nothing changed.`
                : feedback.notified === 'sent'
                  ? `Set to ${STATUS_META[feedback.status].label.toLowerCase()} and the applicant was emailed.`
                  : feedback.notified === 'failed'
                    ? `Set to ${STATUS_META[feedback.status].label.toLowerCase()}, but the email failed. Check the email status endpoint.`
                    : `Set to ${STATUS_META[feedback.status].label.toLowerCase()}. No email is sent for this status.`}
            </span>
          </p>
        )}
      </div>

      <div className="space-y-3.5 text-xs font-mono">
        <div>
          <span className="text-ink-muted uppercase text-[10px] block mb-1">{studentIdLabel(app.year)}</span>
          <p className="text-ink">{app.usn}</p>
        </div>

        <div>
          <span className="text-ink-muted uppercase text-[10px] block mb-1">Contact</span>
          <p className="text-ink break-all">
            <a href={`mailto:${app.email}`} className="hover:underline">{app.email}</a>
            {' • '}
            <a href={`tel:${app.phone}`} className="hover:underline">{app.phone}</a>
          </p>
        </div>

        {app.year === '1st' && (
          <div>
            <span className="text-ink-muted uppercase text-[10px] block mb-1">Languages known</span>
            {app.languages && app.languages.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {app.languages.map((lang) => (
                  <li
                    key={lang}
                    className="bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded-full text-[11px]"
                  >
                    {lang}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-muted">Not answered</p>
            )}
          </div>
        )}

        <GithubStats githubUrl={app.github_url} />

        {app.linkedin_url && (
          <div>
            <span className="text-ink-muted uppercase text-[10px] block mb-1">LinkedIn</span>
            <a
              href={app.linkedin_url}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline inline-flex items-center gap-1"
            >
              <span className="break-all">{app.linkedin_url}</span>
              <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
            </a>
          </div>
        )}

        {app.extra_links && app.extra_links.length > 0 && (
          <div>
            <span className="text-ink-muted uppercase text-[10px] block mb-1">Extra profiles</span>
            {app.extra_links.map((l, i) =>
              l.url ? (
                <a
                  key={`${l.label}-${i}`}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline block break-all"
                >
                  {l.label}: {l.url}
                </a>
              ) : null
            )}
          </div>
        )}

        <div>
          <span className="text-ink-muted uppercase text-[10px] block mb-1">Statement</span>
          <p className="bg-subsurface border border-border p-3.5 rounded-xl text-ink font-body">{app.about_text}</p>
        </div>
      </div>

      <div className="pt-6 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">Decision</span>
          {saving && (
            <span className="text-[10px] font-mono text-ink-muted inline-flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" /> saving
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusButton
            target="accepted"
            current={app.status}
            saving={saving}
            onClick={() => onStatusChange(app.id, 'accepted')}
            activeClass="bg-[#E11D48] !text-white ring-accent"
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" /><span>Accept</span>
          </StatusButton>
          <StatusButton
            target="under_review"
            current={app.status}
            saving={saving}
            onClick={() => onStatusChange(app.id, 'under_review')}
            activeClass="bg-sky-500/20 text-sky-400 ring-sky-500"
          >
            <Clock className="w-4 h-4" aria-hidden="true" /><span>In Review</span>
          </StatusButton>
          <StatusButton
            target="rejected"
            current={app.status}
            saving={saving}
            onClick={() => onStatusChange(app.id, 'rejected')}
            activeClass="bg-subsurface text-ink ring-border"
          >
            <XCircle className="w-4 h-4" aria-hidden="true" /><span>Reject</span>
          </StatusButton>
        </div>
        <p className="mt-2 text-[10px] font-mono text-ink-muted">
          Accept and Reject email the applicant. In Review does not.
        </p>
      </div>
    </div>
  );
}
