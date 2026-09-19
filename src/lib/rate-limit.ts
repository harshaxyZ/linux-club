import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Rate limiting that survives serverless cold starts.
 *
 * The in-process Map that used to back this was per-instance and per-cold-start,
 * so on Vercel the published limits were mostly decorative. Counters now live in
 * Postgres (`public.rate_limit_hit`), with the Map kept only as a fallback for
 * when the RPC is unavailable (e.g. the migration has not been applied yet).
 *
 * Keys are hashed before they leave the process so emails and IPs are not
 * persisted in the counter table.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;
let lastSweep = 0;

/** Drop expired buckets so the fallback map cannot grow without bound. */
function sweep(now: number): void {
  if (now - lastSweep < 60_000 && buckets.size < MAX_BUCKETS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
  if (buckets.size >= MAX_BUCKETS) {
    // Still oversized (sustained attack): drop the oldest entries.
    const excess = buckets.size - Math.floor(MAX_BUCKETS / 2);
    let removed = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (++removed >= excess) break;
    }
  }
}

/** Process-local limiter. Exported for tests and used as the RPC fallback. */
export function rateLimitInMemory(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

async function hashKey(key: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

let rpcUnavailableUntil = 0;

/**
 * Consumes one token for `key`. Returns true when the request is allowed.
 * Falls back to the in-process limiter if the database counter is unreachable.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (Date.now() < rpcUnavailableUntil) {
    return rateLimitInMemory(key, limit, windowMs);
  }
  try {
    const admin = createClient(env.supabaseUrl, env.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin.rpc('rate_limit_hit', {
      p_key: await hashKey(key),
      p_limit: limit,
      p_window_ms: windowMs,
    });
    if (error) throw new Error(error.message);
    // Belt and braces: also consume a local token so a single instance cannot
    // burst past the limit between database round trips.
    const local = rateLimitInMemory(key, limit, windowMs);
    return data === true && local;
  } catch (err) {
    // Stop hammering a missing/broken RPC for a minute.
    rpcUnavailableUntil = Date.now() + 60_000;
    console.error('rate_limit_hit RPC unavailable, using in-memory limiter:', err);
    return rateLimitInMemory(key, limit, windowMs);
  }
}

/** Consumes a token from every bucket; allowed only if all of them permit it. */
export async function rateLimitAll(
  checks: Array<{ key: string; limit: number; windowMs: number } | null | undefined>
): Promise<boolean> {
  let allowed = true;
  for (const check of checks) {
    if (!check) continue;
    const ok = await rateLimit(check.key, check.limit, check.windowMs);
    if (!ok) allowed = false;
  }
  return allowed;
}
