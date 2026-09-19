'use client';

const KEY = 'loss_device_id';
const RE = /^[A-Za-z0-9_-]{8,64}$/;

/** Stable per-browser id used for abuse controls. Created lazily, never PII. */
export function getOrCreateDeviceId(): string {
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id || !RE.test(id)) {
      const raw = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      id = raw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) || 'dev-fallback-id';
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return 'dev-fallback-id';
  }
}

export function deviceHeaders(): Record<string, string> {
  try {
    return { 'x-device-id': getOrCreateDeviceId() };
  } catch {
    return {};
  }
}
