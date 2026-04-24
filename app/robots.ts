import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://monetika.app';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/signup'],
        disallow: [
          '/dashboard',
          '/accounts',
          '/transactions',
          '/budget',
          '/goals',
          '/insights',
          '/score',
          '/settings',
          '/onboarding',
          '/api/',
          '/verify',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
