import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

/** Public pages only: /admin and /account are deliberately excluded. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ['', '/apply', '/privacy', '/terms'].map((path) => ({
    url: `${env.appUrl}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.7,
  }));
}
