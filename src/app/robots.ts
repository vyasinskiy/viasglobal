import { MetadataRoute } from 'next';
import { COMPANY_DOMAIN } from '../config/constants';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `https://${COMPANY_DOMAIN}/sitemap.xml`,
  };
}
