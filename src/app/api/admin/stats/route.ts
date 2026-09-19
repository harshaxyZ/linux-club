import { NextResponse } from 'next/server';
import { adminClient, getSessionUser, isAdmin } from '@/lib/auth';
import { rateLimitAll } from '@/lib/rate-limit';
import { COURSES, YEARS } from '@/lib/form-options';

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' } as const;
const STATUSES = ['pending', 'under_review', 'accepted', 'rejected'] as const;

interface StatRow {
  year: string | null;
  course: string | null;
  section: string | null;
  status: string | null;
  languages: string[] | null;
  github_url: string | null;
  linkedin_url: string | null;
  extra_links: unknown;
  created_at: string;
}

function tally(values: Array<string | null | undefined>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const value of values) {
    const key = (value ?? 'Unknown').toString();
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Aggregated dashboard figures. Computed over the whole table rather than the
 * 500-row page the tracker list fetches, using only the columns needed so a
 * stats refresh never ships full applicant PII.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user || !(await isAdmin(user.email, user.id))) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403, headers: NO_STORE });
  }
  if (!(await rateLimitAll([{ key: `admin:stats:${user.id}`, limit: 120, windowMs: 60 * 1000 }]))) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: NO_STORE });
  }

  const { data, error } = await adminClient()
    .from('applications')
    .select('year,course,section,status,languages,github_url,linkedin_url,extra_links,created_at')
    .order('created_at', { ascending: false })
    .limit(20000);

  if (error) {
    console.error('Admin stats failed:', error.message);
    return NextResponse.json({ error: 'Could not load stats.' }, { status: 500, headers: NO_STORE });
  }

  const rows = (data ?? []) as unknown as StatRow[];
  const now = new Date();
  const todayKey = isoDay(now);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  const byStatus = tally(rows.map((r) => r.status));
  const byYear = tally(rows.map((r) => r.year));
  const byCourse = tally(rows.map((r) => r.course));
  const bySection = tally(rows.map((r) => r.section));

  // Language histogram, first years only (the only cohort that is asked).
  const languageCounts: Record<string, number> = {};
  let firstYearWithLanguages = 0;
  for (const row of rows) {
    if (row.year !== '1st' || !Array.isArray(row.languages) || row.languages.length === 0) continue;
    firstYearWithLanguages += 1;
    for (const language of row.languages) {
      languageCounts[language] = (languageCounts[language] ?? 0) + 1;
    }
  }

  // Submissions per day for the last 14 days, oldest first.
  const perDay: Array<{ date: string; count: number }> = [];
  for (let i = 13; i >= 0; i -= 1) {
    const day = isoDay(new Date(now.getTime() - i * 24 * 3600 * 1000));
    perDay.push({ date: day, count: 0 });
  }
  const dayIndex = new Map(perDay.map((entry, index) => [entry.date, index]));
  for (const row of rows) {
    const index = dayIndex.get(row.created_at.slice(0, 10));
    if (index !== undefined) perDay[index].count += 1;
  }

  const withGithub = rows.filter((r) => !!r.github_url).length;
  const withLinkedin = rows.filter((r) => !!r.linkedin_url).length;
  const withExtraLinks = rows.filter(
    (r) => Array.isArray(r.extra_links) && (r.extra_links as unknown[]).length > 0
  ).length;

  const total = rows.length;
  const reviewed = (byStatus.accepted ?? 0) + (byStatus.rejected ?? 0);

  return NextResponse.json(
    {
      generatedAt: now.toISOString(),
      total,
      today: rows.filter((r) => r.created_at.slice(0, 10) === todayKey).length,
      last7Days: rows.filter((r) => new Date(r.created_at) >= sevenDaysAgo).length,
      byStatus: Object.fromEntries(STATUSES.map((s) => [s, byStatus[s] ?? 0])),
      byYear: Object.fromEntries(YEARS.map((y) => [y, byYear[y] ?? 0])),
      byCourse: Object.fromEntries(
        Object.entries(byCourse).sort((a, b) => b[1] - a[1])
      ),
      knownCourses: COURSES,
      bySection: Object.fromEntries(Object.entries(bySection).sort((a, b) => b[1] - a[1]).slice(0, 12)),
      languages: Object.fromEntries(Object.entries(languageCounts).sort((a, b) => b[1] - a[1])),
      firstYearWithLanguages,
      profiles: {
        withGithub,
        withoutGithub: total - withGithub,
        withLinkedin,
        withExtraLinks,
      },
      reviewed,
      pendingReview: total - reviewed,
      acceptanceRate: reviewed > 0 ? Math.round(((byStatus.accepted ?? 0) / reviewed) * 100) : null,
      perDay,
    },
    { headers: NO_STORE }
  );
}
