'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, FileJson, FileSpreadsheet, FileText, Table } from 'lucide-react';
import type { Application } from '../../lib/application-types';
import { EXPORT_COLUMNS, exportFilename, toCsv, toExportRow, toJson, toTsv } from '../../lib/export';
import { XLSX_MIME, buildXlsx } from '../../lib/xlsx';

export interface ExportFilters {
  year: string;
  status: string;
  search: string;
}

interface ExportMenuProps {
  /** Rows currently shown, used when the wider fetch is unavailable. */
  apps: Application[];
  filters: ExportFilters;
  /** Fetches every row matching the current filters, not just the loaded page. */
  fetchAll: () => Promise<Application[] | null>;
}

type Format = 'xlsx' | 'csv' | 'tsv' | 'json';

const FORMATS: Array<{ id: Format; label: string; hint: string; icon: React.ReactNode }> = [
  { id: 'xlsx', label: 'Excel (.xlsx)', hint: 'opens directly in Excel', icon: <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" /> },
  { id: 'csv', label: 'CSV (.csv)', hint: 'universal, Excel-safe encoding', icon: <FileText className="w-3.5 h-3.5" aria-hidden="true" /> },
  { id: 'tsv', label: 'TSV (.tsv)', hint: 'paste into Sheets', icon: <Table className="w-3.5 h-3.5" aria-hidden="true" /> },
  { id: 'json', label: 'JSON (.json)', hint: 'full records, for scripts', icon: <FileJson className="w-3.5 h-3.5" aria-hidden="true" /> },
];

function download(filename: string, data: BlobPart, mime: string) {
  const url = URL.createObjectURL(new Blob([data], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export of whatever the current filters match, in the format the reviewer picks.
 *
 * The rows come from a fresh request rather than the loaded page, because the
 * tracker caps its list and an export that silently stops at the cap is worse
 * than no export.
 */
export function ExportMenu({ apps, filters, fetchAll }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Format | null>(null);
  const [note, setNote] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const activeFilters = [
    filters.year !== 'All' ? `${filters.year} year` : null,
    filters.status !== 'All' ? filters.status.replace('_', ' ') : null,
    filters.search ? `"${filters.search}"` : null,
  ].filter(Boolean);

  const run = async (format: Format) => {
    setBusy(format);
    setNote('');
    try {
      const rows = (await fetchAll()) ?? apps;
      if (rows.length === 0) {
        setNote('Nothing to export for these filters.');
        return;
      }
      const table = rows.map(toExportRow);

      if (format === 'xlsx') {
        const bytes = buildXlsx({ name: 'Applications', headers: [...EXPORT_COLUMNS], rows: table });
        // Copy into a plain ArrayBuffer: TypeScript's BlobPart excludes the
        // SharedArrayBuffer-backed variant of Uint8Array.
        const buffer = new ArrayBuffer(bytes.byteLength);
        new Uint8Array(buffer).set(bytes);
        download(exportFilename('xlsx', filters), buffer, XLSX_MIME);
      } else if (format === 'csv') {
        download(exportFilename('csv', filters), toCsv(EXPORT_COLUMNS, table), 'text/csv;charset=utf-8');
      } else if (format === 'tsv') {
        download(exportFilename('tsv', filters), toTsv(EXPORT_COLUMNS, table), 'text/tab-separated-values;charset=utf-8');
      } else {
        download(exportFilename('json', filters), toJson(rows), 'application/json');
      }

      setNote(`${rows.length} record${rows.length === 1 ? '' : 's'} exported.`);
      setOpen(false);
      setTimeout(() => setNote(''), 4000);
    } catch (err) {
      console.error('Export failed:', err);
      setNote('Export failed. Try a different format or reload.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface text-xs font-mono cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
        <span>Export</span>
        <ChevronDown className="w-3 h-3 text-ink-muted" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Export format"
          className="absolute right-0 mt-2 w-64 z-40 rounded-2xl border border-border bg-surface shadow-2xl p-2"
        >
          <p className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-muted">
            {activeFilters.length > 0 ? `Filtered: ${activeFilters.join(' • ')}` : 'All applications'}
          </p>
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="menuitem"
              disabled={busy !== null}
              onClick={() => run(f.id)}
              className="w-full text-left px-2 py-2 rounded-xl hover:bg-subsurface cursor-pointer disabled:opacity-50 flex items-start gap-2"
            >
              <span className="text-accent mt-0.5">{f.icon}</span>
              <span>
                <span className="block text-xs font-mono text-ink">
                  {busy === f.id ? 'Preparing…' : f.label}
                </span>
                <span className="block text-[10px] font-mono text-ink-muted">{f.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {note && (
        <p className="absolute right-0 top-full mt-1 whitespace-nowrap text-[10px] font-mono text-accent" aria-live="polite">
          {note}
        </p>
      )}
    </div>
  );
}
