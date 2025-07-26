import { baseSEO } from '@/config/seo';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/dashboard/',
        '/auth/',
        '/_next/',
        '/api/',
      ],
    },
    sitemap: `${baseSEO.siteUrl}/sitemap.xml`,
  };
}
