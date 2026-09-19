import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

/**
 * The site had no robots.txt at all (404), so the admin console and the personal
 * account page were crawlable. Paths that only ever show signed-in or reviewer
 * content are disallowed here and also marked noindex by a header in
 * next.config.ts, since robots.txt is advisory.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/apply', '/privacy', '/terms'],
        disallow: ['/admin', '/account', '/api/', '/auth/'],
      },
    ],
    sitemap: `${env.appUrl}/sitemap.xml`,
    host: env.appUrl,
  };
}
