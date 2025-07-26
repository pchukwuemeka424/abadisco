import { baseSEO } from '@/config/seo';

export default function sitemap() {
  const baseUrl = baseSEO.siteUrl;
  
  // Define static routes
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/search',
    '/markets',
  ];

  const routes = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' ? 'daily' : 'weekly' as const,
    priority: route === '' ? 1 : 0.7,
  }));

  return routes;
}
