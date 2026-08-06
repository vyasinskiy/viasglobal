import { MetadataRoute } from 'next';
import { i18n } from '../i18n/config';
import { COMPANY_DOMAIN } from '../config/constants';

const baseUrl = `https://${COMPANY_DOMAIN}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/aviso-legal', '/politica-privacidad', '/politica-cookies'];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  routes.forEach((route) => {
    i18n.locales.forEach((locale) => {
      const url = `${baseUrl}/${locale}${route}`;
      
      const languages: Record<string, string> = {};
      i18n.locales.forEach((l) => {
        languages[l] = `${baseUrl}/${l}${route}`;
      });

      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.8,
        alternates: {
          languages,
        },
      });
    });
  });

  return sitemapEntries;
}
