import { adminClient } from './auth';

export interface AppSettings {
  applicationsOpen: boolean;
  closedMessage: string | null;
  closesAt: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export const DEFAULT_CLOSED_MESSAGE =
  'Applications are closed right now. Follow the Discord for the next recruitment drive.';

const FALLBACK: AppSettings = {
  applicationsOpen: true,
  closedMessage: null,
  closesAt: null,
  updatedAt: null,
  updatedBy: null,
};

let cache: { at: number; value: AppSettings } | null = null;
const CACHE_TTL_MS = 15_000;

/**
 * Reads the single settings row.
 *
 * Cached briefly because /apply and every submission consult it. If the table is
 * missing (migration not applied yet) it falls back to open rather than locking
 * everyone out of a working form.
 */
export async function getAppSettings(force = false): Promise<AppSettings> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.value;
  try {
    const { data, error } = await adminClient()
      .from('app_settings')
      .select('applications_open,closed_message,closes_at,updated_at,updated_by')
      .eq('id', true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const value: AppSettings = data
      ? {
          applicationsOpen: data.applications_open !== false,
          closedMessage: data.closed_message ?? null,
          closesAt: data.closes_at ?? null,
          updatedAt: data.updated_at ?? null,
          updatedBy: data.updated_by ?? null,
        }
      : FALLBACK;
    cache = { at: Date.now(), value };
    return value;
  } catch (err) {
    console.error('Could not read app_settings, defaulting to open:', err);
    return FALLBACK;
  }
}

/** Invalidates the cache after a write so admins see their change immediately. */
export function clearAppSettingsCache(): void {
  cache = null;
}

/**
 * Whether the form should accept submissions: the toggle must be on and any
 * deadline must still be in the future.
 */
export function applicationsAccepting(settings: AppSettings, now = new Date()): boolean {
  if (!settings.applicationsOpen) return false;
  if (settings.closesAt && new Date(settings.closesAt).getTime() <= now.getTime()) return false;
  return true;
}

export function closedMessageFor(settings: AppSettings): string {
  return settings.closedMessage?.trim() || DEFAULT_CLOSED_MESSAGE;
}
