const DEVICE_RE = /^[A-Za-z0-9_-]{8,64}$/;

export function isValidDeviceId(id: string): boolean {
  return DEVICE_RE.test(id);
}

/** Prefer the httpOnly `did` cookie, fall back to the `x-device-id` header. */
export function resolveDeviceId(headers: Headers, cookies: { get(name: string): { value: string } | undefined }): string | null {
  const fromCookie = cookies.get('did')?.value;
  if (fromCookie && isValidDeviceId(fromCookie)) return fromCookie;
  const fromHeader = headers.get('x-device-id')?.trim() ?? '';
  if (fromHeader && isValidDeviceId(fromHeader)) return fromHeader;
  return null;
}

export function ensureDeviceCookie(res: Response, deviceId: string, secure: boolean): void {
  res.headers.append(
    'Set-Cookie',
    `did=${deviceId}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly${secure ? '; Secure' : ''}`
  );
}
