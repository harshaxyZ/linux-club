'use client';

import React from 'react';
import { CheckCircle2, Clock, ExternalLink, XCircle } from 'lucide-react';
import type { Application, ApplicationStatus } from '../../lib/application-types';
import { studentIdLabel } from '../../lib/form-options';
import { GithubStats } from './GithubStats';

interface ApplicantDetailsProps {
  app: Application;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}

export function ApplicantDetails({ app, onStatusChange }: ApplicantDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h3 className="font-heading font-extrabold text-xl">{app.full_name}</h3>
        <p className="font-mono text-xs text-ink-muted mt-0.5">
          {app.usn} • {app.course} ({app.year}, Sec {app.section})
        </p>
        <p className="font-mono text-[11px] text-ink-muted mt-1">
          Applied {new Date(app.created_at).toLocaleString()}
        </p>
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

      <div className="pt-6 border-t border-border flex flex-wrap gap-2">
        <button
          onClick={() => onStatusChange(app.id, 'accepted')}
          className="flex-1 bg-[#E11D48] !text-white font-mono font-bold text-xs py-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" /><span>Accept</span>
        </button>
        <button
          onClick={() => onStatusChange(app.id, 'under_review')}
          className="flex-1 bg-subsurface font-mono font-bold text-xs py-3 rounded-xl border border-border cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Clock className="w-4 h-4" aria-hidden="true" /><span>In Review</span>
        </button>
        <button
          onClick={() => onStatusChange(app.id, 'rejected')}
          className="flex-1 bg-surface text-ink-muted font-mono font-bold text-xs py-3 rounded-xl border border-border cursor-pointer flex items-center justify-center gap-1.5"
        >
          <XCircle className="w-4 h-4" aria-hidden="true" /><span>Reject</span>
        </button>
      </div>
    </div>
  );
}
