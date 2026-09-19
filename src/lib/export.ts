import type { Application } from './application-types';
import { studentIdLabel } from './form-options';

/** Columns exported, in order. Kept in one place so every format matches. */
export const EXPORT_COLUMNS = [
  'Full Name',
  'USN / Reg No',
  'ID Type',
  'Year',
  'Section',
  'Branch',
  'Email',
  'Phone',
  'GitHub',
  'LinkedIn',
  'Extra Profiles',
  'Languages',
  'Statement',
  'Status',
  'Submitted (local)',
  'Submitted (ISO)',
] as const;

export function toExportRow(app: Application): Array<string | number> {
  return [
    app.full_name,
    app.usn,
    studentIdLabel(app.year),
    app.year,
    app.section,
    app.course,
    app.email,
    // Kept as text: a leading zero or a 10-digit number would otherwise be
    // mangled into scientific notation by spreadsheet software.
    app.phone,
    app.github_url ?? '',
    app.linkedin_url ?? '',
    (app.extra_links ?? [])
      .filter((l) => l && l.url)
      .map((l) => `${l.label}: ${l.url}`)
      .join(' | '),
    (app.languages ?? []).join('; '),
    app.about_text,
    app.status,
    new Date(app.created_at).toLocaleString(),
    app.created_at,
  ];
}

/**
 * RFC 4180 CSV with a UTF-8 BOM and CRLF endings, which is what Excel needs to
 * read non-ASCII names correctly instead of showing mojibake.
 */
export function toCsv(headers: readonly string[], rows: Array<Array<string | number>>): string {
  const esc = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))];
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

/** Tab-separated, for pasting straight into Sheets or Excel. */
export function toTsv(headers: readonly string[], rows: Array<Array<string | number>>): string {
  const clean = (v: string | number) => String(v ?? '').replace(/[\t\r\n]+/g, ' ');
  return [headers.join('\t'), ...rows.map((r) => r.map(clean).join('\t'))].join('\r\n');
}

export function toJson(apps: Application[]): string {
  return JSON.stringify(apps, null, 2);
}

/** `loss-applications-2026-09-19_1st-year_pending.csv` */
export function exportFilename(
  extension: string,
  filters: { year: string; status: string; search: string }
): string {
  const parts = ['loss-applications', new Date().toISOString().slice(0, 10)];
  if (filters.year !== 'All') parts.push(`${filters.year}-year`);
  if (filters.status !== 'All') parts.push(filters.status);
  if (filters.search) parts.push(`search-${filters.search.replace(/[^A-Za-z0-9]+/g, '-').slice(0, 20)}`);
  return `${parts.join('_')}.${extension}`;
}
