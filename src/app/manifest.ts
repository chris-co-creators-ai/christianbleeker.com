import type { MetadataRoute } from 'next'
import { site } from '@/content/site'

/**
 * Web-manifest: nette "zet op beginscherm" en de juiste kleur in de
 * adresbalk op Android. Geen PWA: geen service worker, `display: 'browser'`. Kleuren = de
 * neutrale tokens uit globals.css; een klantsite zet hier zijn merkkleur.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.naam,
    short_name: site.naam.length > 12 ? site.naam.split(' ')[0] : site.naam,
    lang: 'nl',
    start_url: '/',
    display: 'browser',
    background_color: '#17110f',
    theme_color: '#17110f',
    icons: [
      { src: '/icoon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icoon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icoon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
