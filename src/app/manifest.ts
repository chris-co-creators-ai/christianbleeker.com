import type { MetadataRoute } from 'next'
import { site } from '@/content/site'

/**
 * Web-manifest (Lars 29-09, na Social Next): nette "zet op beginscherm" en de juiste kleur in de
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
    background_color: '#ffffff',
    theme_color: '#101010',
    icons: [
      { src: '/icoon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icoon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icoon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
