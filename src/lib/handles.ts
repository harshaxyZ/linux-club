/**
 * The form collects usernames behind a fixed `https://github.com/` or
 * `https://linkedin.com/in/` prefix, but the database keeps full URLs (the
 * admin console and CSV export link straight to them). These helpers convert
 * between the two and validate what the user typed.
 */

export const GITHUB_PREFIX = 'https://github.com/';
export const LINKEDIN_PREFIX = 'https://linkedin.com/in/';

/** GitHub rules: 1-39 chars, alphanumeric or single inner hyphens. */
const GITHUB_HANDLE_RE = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;

/** Deliberately permissive: LinkedIn vanity URLs allow unicode and digits. */
const LINKEDIN_HANDLE_RE = /^[^\s/?#]{2,100}$/;

/**
 * Accepts a bare username or a pasted profile URL and returns the username.
 * Query strings, trailing slashes and an `@` prefix are stripped.
 */
export function extractHandle(input: string, knownHosts: string[]): string {
  let value = input.trim();
  if (!value) return '';

  if (/^(https?:)?\/\//i.test(value) || knownHosts.some((h) => value.toLowerCase().startsWith(h))) {
    try {
      const url = new URL(value.startsWith('http') ? value : `https://${value}`);
      const segments = url.pathname.split('/').filter(Boolean);
      // linkedin.com/in/<handle> -> drop the "in" segment.
      value = segments.length > 1 ? segments[segments.length - 1] : (segments[0] ?? '');
    } catch {
      /* fall through and clean the raw string */
    }
  }

  return value.replace(/^@+/, '').replace(/[/?#].*$/, '').trim();
}

export function normalizeGithubHandle(input: string): string {
  return extractHandle(input, ['github.com', 'www.github.com']);
}

export function normalizeLinkedinHandle(input: string): string {
  return extractHandle(input, ['linkedin.com', 'www.linkedin.com']);
}

export function isValidGithubHandle(handle: string): boolean {
  return GITHUB_HANDLE_RE.test(handle);
}

export function isValidLinkedinHandle(handle: string): boolean {
  return LINKEDIN_HANDLE_RE.test(handle);
}

export function githubUrlFromHandle(handle: string): string {
  return `${GITHUB_PREFIX}${handle}`;
}

export function linkedinUrlFromHandle(handle: string): string {
  return `${LINKEDIN_PREFIX}${handle}`;
}
