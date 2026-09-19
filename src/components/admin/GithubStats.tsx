'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ExternalLink, GitFork, Star, Users } from 'lucide-react';
import { isValidGithubHandle, normalizeGithubHandle } from '../../lib/handles';

interface GithubStats {
  login: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string;
  htmlUrl: string;
  company: string | null;
  location: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  createdAt: string;
  totalStars: number;
  ownRepos: number;
  forkedRepos: number;
  lastPushAt: string | null;
  topLanguages: Array<{ language: string; repos: number }>;
  topRepos: Array<{ name: string; url: string; stars: number; language: string | null; description: string | null }>;
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl px-3 py-2">
      <p className="text-[9px] font-mono uppercase tracking-wider text-ink-muted flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="font-heading font-extrabold text-ink text-lg leading-tight">{value}</p>
    </div>
  );
}

/**
 * GitHub profile summary for an applicant. The lookup goes through
 * /api/admin/github, which is admin-gated, cached and can use a server-side
 * token, so the browser never talks to api.github.com directly.
 */
export function GithubStats({ githubUrl }: { githubUrl: string | null | undefined }) {
  const handle = githubUrl ? normalizeGithubHandle(githubUrl) : '';
  const usable = Boolean(handle) && isValidGithubHandle(handle);

  const [stats, setStats] = useState<GithubStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!usable) return;
    setLoading(true);
    setError('');
    setStats(null);
    try {
      const res = await fetch(`/api/admin/github?username=${encodeURIComponent(handle)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || 'Could not load GitHub stats.');
      else setStats(data as GithubStats);
    } catch {
      setError('Network error while loading GitHub stats.');
    } finally {
      setLoading(false);
    }
  }, [handle, usable]);

  useEffect(() => {
    load();
  }, [load]);

  if (!githubUrl) {
    return (
      <div>
        <span className="text-ink-muted uppercase text-[10px] block mb-1">GitHub</span>
        <p className="text-ink-muted">Not provided</p>
      </div>
    );
  }

  if (!usable) {
    return (
      <div>
        <span className="text-ink-muted uppercase text-[10px] block mb-1">GitHub</span>
        <p className="text-amber-500 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
          Not a valid username: {githubUrl}
        </p>
      </div>
    );
  }

  return (
    <div>
      <span className="text-ink-muted uppercase text-[10px] block mb-1.5">GitHub</span>
      <a
        href={`https://github.com/${handle}`}
        target="_blank"
        rel="noreferrer"
        className="text-accent hover:underline inline-flex items-center gap-1 mb-2"
      >
        <span className="break-all">github.com/{handle}</span>
        <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
      </a>

      {loading && <p className="text-ink-muted">Loading GitHub stats…</p>}

      {error && !loading && (
        <p className="text-amber-500 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      {stats && !loading && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={stats.avatarUrl}
              alt={`${stats.login} avatar`}
              width={40}
              height={40}
              className="w-10 h-10 rounded-xl border border-border"
              loading="lazy"
            />
            <div className="min-w-0">
              <p className="text-ink font-semibold truncate">{stats.name || stats.login}</p>
              <p className="text-ink-muted text-[11px] truncate">
                joined {new Date(stats.createdAt).toLocaleDateString()}
                {stats.location ? ` • ${stats.location}` : ''}
              </p>
            </div>
          </div>

          {stats.bio && <p className="text-ink-muted text-[11px] leading-relaxed">{stats.bio}</p>}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat label="Repos" value={stats.ownRepos} />
            <Stat label="Stars" value={stats.totalStars} icon={<Star className="w-3 h-3" aria-hidden="true" />} />
            <Stat label="Followers" value={stats.followers} icon={<Users className="w-3 h-3" aria-hidden="true" />} />
            <Stat label="Forks" value={stats.forkedRepos} icon={<GitFork className="w-3 h-3" aria-hidden="true" />} />
          </div>

          {stats.lastPushAt && (
            <p className="text-[11px] text-ink-muted">
              Last push {new Date(stats.lastPushAt).toLocaleDateString()}
            </p>
          )}

          {stats.topLanguages.length > 0 && (
            <div>
              <span className="text-ink-muted uppercase text-[9px] block mb-1">Languages used</span>
              <ul className="flex flex-wrap gap-1.5">
                {stats.topLanguages.map((l) => (
                  <li
                    key={l.language}
                    className="bg-subsurface border border-border text-ink px-2 py-0.5 rounded-full text-[10px]"
                  >
                    {l.language} <span className="text-ink-muted">({l.repos})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {stats.topRepos.length > 0 && (
            <div>
              <span className="text-ink-muted uppercase text-[9px] block mb-1">Top repositories</span>
              <ul className="space-y-1">
                {stats.topRepos.map((repo) => (
                  <li key={repo.name} className="flex items-start gap-2">
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:underline shrink-0"
                    >
                      {repo.name}
                    </a>
                    <span className="text-ink-muted text-[10px] shrink-0">
                      ★ {repo.stars}
                      {repo.language ? ` • ${repo.language}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
