'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, BarChart3, RefreshCw } from 'lucide-react';

export interface AdminStats {
  generatedAt: string;
  total: number;
  today: number;
  last7Days: number;
  byStatus: Record<string, number>;
  byYear: Record<string, number>;
  byCourse: Record<string, number>;
  bySection: Record<string, number>;
  languages: Record<string, number>;
  firstYearWithLanguages: number;
  profiles: {
    withGithub: number;
    withoutGithub: number;
    withLinkedin: number;
    withExtraLinks: number;
  };
  reviewed: number;
  pendingReview: number;
  acceptanceRate: number | null;
  perDay: Array<{ date: string; count: number }>;
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: 'accent' }) {
  return (
    <div className="bg-subsurface border border-border rounded-2xl p-4">
      <p className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">{label}</p>
      <p className={`mt-1 font-heading font-extrabold text-2xl ${tone === 'accent' ? 'text-accent' : 'text-ink'}`}>
        {value}
      </p>
    </div>
  );
}

function Breakdown({
  title,
  data,
  emptyLabel = 'No data yet',
}: {
  title: string;
  data: Record<string, number>;
  emptyLabel?: string;
}) {
  const entries = Object.entries(data).filter(([, count]) => count > 0);
  const max = entries.reduce((m, [, count]) => Math.max(m, count), 0);

  return (
    <div>
      <h4 className="text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-2">{title}</h4>
      {entries.length === 0 ? (
        <p className="text-xs font-mono text-ink-muted">{emptyLabel}</p>
      ) : (
        <ul className="space-y-1.5">
          {entries.map(([key, count]) => (
            <li key={key} className="flex items-center gap-2 text-xs font-mono">
              <span className="w-28 shrink-0 truncate text-ink" title={key}>{key}</span>
              <span className="flex-1 h-2 rounded-full bg-border/60 overflow-hidden" aria-hidden="true">
                <span
                  className="block h-full bg-accent/70"
                  style={{ width: max > 0 ? `${Math.max(4, (count / max) * 100)}%` : '0%' }}
                />
              </span>
              <span className="w-8 text-right text-ink-muted">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Detailed recruitment statistics, aggregated server-side over every row. */
export function StatsPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not load statistics.');
      } else {
        setStats(data as AdminStats);
      }
    } catch {
      setError('Network error while loading statistics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const peakDay = stats?.perDay.reduce((max, d) => Math.max(max, d.count), 0) ?? 0;

  return (
    <section aria-labelledby="stats-heading" className="minimal-card rounded-3xl p-6 mb-8">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" aria-hidden="true" />
          <h3 id="stats-heading" className="font-heading font-extrabold text-lg">Recruitment statistics</h3>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface text-xs font-mono cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-accent ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
        </button>
      </div>

      {error ? (
        <p className="text-xs font-mono text-red-500 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
          {error}
        </p>
      ) : !stats ? (
        <p className="text-xs font-mono text-ink-muted">Loading statistics…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Metric label="Total" value={stats.total} tone="accent" />
            <Metric label="Today" value={stats.today} />
            <Metric label="Last 7 days" value={stats.last7Days} />
            <Metric label="Awaiting review" value={stats.pendingReview} />
            <Metric label="Accepted" value={stats.byStatus.accepted ?? 0} />
            <Metric
              label="Acceptance rate"
              value={stats.acceptanceRate === null ? 'n/a' : `${stats.acceptanceRate}%`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Breakdown
              title="By status"
              data={{
                Pending: stats.byStatus.pending ?? 0,
                'In review': stats.byStatus.under_review ?? 0,
                Accepted: stats.byStatus.accepted ?? 0,
                Rejected: stats.byStatus.rejected ?? 0,
              }}
            />
            <Breakdown title="By year" data={stats.byYear} />
            <Breakdown title="By branch" data={stats.byCourse} />
            <Breakdown title="By section (top 12)" data={stats.bySection} />
            <Breakdown
              title={`First-year languages (${stats.firstYearWithLanguages} answered)`}
              data={stats.languages}
              emptyLabel="No first-year answers yet"
            />
            <Breakdown
              title="Profile links"
              data={{
                GitHub: stats.profiles.withGithub,
                'No GitHub': stats.profiles.withoutGithub,
                LinkedIn: stats.profiles.withLinkedin,
                'Extra profiles': stats.profiles.withExtraLinks,
              }}
            />
          </div>

          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-2">
              Submissions, last 14 days (peak {peakDay})
            </h4>
            <ol className="flex items-end gap-1.5 h-24" aria-label="Submissions per day for the last 14 days">
              {stats.perDay.map((day) => (
                <li
                  key={day.date}
                  className="flex-1 flex flex-col items-center justify-end gap-1"
                  title={`${day.date}: ${day.count}`}
                >
                  <span className="text-[9px] font-mono text-ink-muted">{day.count}</span>
                  <span
                    className="w-full rounded-t bg-accent/60"
                    style={{ height: peakDay > 0 ? `${Math.max(2, (day.count / peakDay) * 100)}%` : '2px' }}
                    aria-hidden="true"
                  />
                  <span className="text-[9px] font-mono text-ink-muted">{day.date.slice(8)}</span>
                </li>
              ))}
            </ol>
          </div>

          <p className="text-[10px] font-mono text-ink-muted">
            Generated {new Date(stats.generatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </section>
  );
}
