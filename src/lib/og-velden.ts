import { site } from '@/content/site'

/** openGraph per pagina. Next vervangt het hele object van de layout, dus de vaste velden gaan hier mee. */
export const og = (title: string, description: string, url: string, extra: Record<string, unknown> = {}) =>
  ({ title, description, url, siteName: site.naam, locale: 'nl_NL', type: 'website' as const, ...extra })
