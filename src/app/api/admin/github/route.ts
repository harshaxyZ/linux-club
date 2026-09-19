import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { rateLimitAll } from '@/lib/rate-limit';
import { isValidGithubHandle, normalizeGithubHandle } from '@/lib/handles';

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' } as const;
const CACHE_TTL_MS = 10 * 60 * 1000;

export interface GithubStats {
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

interface CacheEntry {
  at: number;
  status: number;
  body: unknown;
}

// Per-instance cache. GitHub allows 60 unauthenticated requests per hour per IP
// and each lookup costs two, so without this a reviewer paging through
// applications would exhaust the quota in minutes.
const cache = new Map<string, CacheEntry>();

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'linux-oss-club-admin',
  };
  // Optional: raises the rate limit from 60/hour to 5000/hour.
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

interface GithubRepo {
  name: string;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  description: string | null;
  fork: boolean;
  pushed_at: string | null;
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !(await isAdmin(user.email, user.id))) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403, headers: NO_STORE });
  }

  const raw = req.nextUrl.searchParams.get('username') ?? '';
  const login = normalizeGithubHandle(raw);
  if (!login || !isValidGithubHandle(login)) {
    return NextResponse.json({ error: 'Invalid GitHub username.' }, { status: 400, headers: NO_STORE });
  }

  const key = login.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return NextResponse.json(hit.body, { status: hit.status, headers: NO_STORE });
  }

  if (!(await rateLimitAll([{ key: `admin:github:${user.id}`, limit: 60, windowMs: 60 * 1000 }]))) {
    return NextResponse.json({ error: 'Too many lookups. Wait a minute.' }, { status: 429, headers: NO_STORE });
  }

  try {
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(login)}`, {
      headers: githubHeaders(),
      cache: 'no-store',
    });

    if (userRes.status === 404) {
      const body = { error: 'No such GitHub user.', login };
      cache.set(key, { at: Date.now(), status: 404, body });
      return NextResponse.json(body, { status: 404, headers: NO_STORE });
    }
    if (userRes.status === 403 || userRes.status === 429) {
      const reset = userRes.headers.get('x-ratelimit-reset');
      console.error('GitHub API rate limited; reset at', reset);
      return NextResponse.json(
        {
          error:
            'GitHub API rate limit reached. Set GITHUB_TOKEN in the environment to raise it from 60 to 5000 requests per hour.',
        },
        { status: 503, headers: NO_STORE }
      );
    }
    if (!userRes.ok) {
      return NextResponse.json({ error: 'GitHub lookup failed.' }, { status: 502, headers: NO_STORE });
    }

    const profile = await userRes.json();

    // Public repos, newest pushes first: enough for stars, languages and activity.
    let repos: GithubRepo[] = [];
    const reposRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(login)}/repos?per_page=100&sort=pushed`,
      { headers: githubHeaders(), cache: 'no-store' }
    );
    if (reposRes.ok) repos = (await reposRes.json()) as GithubRepo[];

    const own = repos.filter((r) => !r.fork);
    const languageCounts = new Map<string, number>();
    for (const repo of own) {
      if (!repo.language) continue;
      languageCounts.set(repo.language, (languageCounts.get(repo.language) ?? 0) + 1);
    }

    const stats: GithubStats = {
      login: profile.login,
      name: profile.name ?? null,
      bio: profile.bio ?? null,
      avatarUrl: profile.avatar_url,
      htmlUrl: profile.html_url,
      company: profile.company ?? null,
      location: profile.location ?? null,
      publicRepos: profile.public_repos ?? 0,
      followers: profile.followers ?? 0,
      following: profile.following ?? 0,
      createdAt: profile.created_at,
      totalStars: own.reduce((sum, r) => sum + (r.stargazers_count ?? 0), 0),
      ownRepos: own.length,
      forkedRepos: repos.length - own.length,
      lastPushAt: repos.find((r) => r.pushed_at)?.pushed_at ?? null,
      topLanguages: [...languageCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([language, count]) => ({ language, repos: count })),
      topRepos: [...own]
        .sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0))
        .slice(0, 3)
        .map((r) => ({
          name: r.name,
          url: r.html_url,
          stars: r.stargazers_count ?? 0,
          language: r.language,
          description: r.description ? r.description.slice(0, 140) : null,
        })),
    };

    cache.set(key, { at: Date.now(), status: 200, body: stats });
    return NextResponse.json(stats, { headers: NO_STORE });
  } catch (err) {
    console.error('GitHub lookup error:', err);
    return NextResponse.json({ error: 'GitHub lookup failed.' }, { status: 502, headers: NO_STORE });
  }
}
