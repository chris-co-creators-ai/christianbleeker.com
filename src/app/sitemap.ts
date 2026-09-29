import type { MetadataRoute } from 'next'
import { site } from '@/content/site'
import { routes } from '@/content/routes'

/** Alle pagina's uit `content/routes.ts`, met `lastmod` (site.bijgewerkt of de bouwdatum). */
export default function sitemap(): MetadataRoute.Sitemap {
  const datum = site.bijgewerkt ? new Date(site.bijgewerkt) : new Date()
  return routes.map((r) => ({
    url: r.pad === '/' ? site.domein : `${site.domein}${r.pad}`,
    lastModified: datum,
    changeFrequency: 'monthly',
    priority: r.prioriteit,
  }))
}
