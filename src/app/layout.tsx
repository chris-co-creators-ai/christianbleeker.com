import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import './site.css'
import { site, talen } from '@/content/site'
import { ui } from '@/content/ui'
import { tabLokzin } from '@/content/teksten'
import { websiteSchema, personSchema } from '@/lib/schema'
import { alternatesVoor } from '@/lib/i18n'
import { Toestemming } from '@/features/toestemming/Toestemming'
import { PageTransitions } from '@/features/page-transitions/PageTransitions'
import { TabTitleLokker } from '@/features/tab-title-lokker/TabTitleLokker'

const unbounded = localFont({
  src: '../fonts/unbounded-latin-wght-normal.woff2',
  variable: '--font-unbounded',
  weight: '200 900',
  display: 'swap',
  preload: true,
})
const manrope = localFont({
  src: '../fonts/manrope-latin-wght-normal.woff2',
  variable: '--font-manrope',
  weight: '200 800',
  display: 'swap',
  preload: true,
})

/** `true` op een Vercel-preview-deploy: dan `noindex`. Productie en lokaal: `index`. */
const isPreviewDeploy = process.env.VERCEL_ENV === 'preview'

export const viewport: Viewport = { themeColor: '#17110f', colorScheme: 'dark' }

export const metadata: Metadata = {
  metadataBase: new URL(site.domein),
  title: site.naam,
  description: site.beschrijving,
  alternates: alternatesVoor(talen, 'nl', '/'),
  openGraph: { title: site.naam, description: site.beschrijving, url: site.domein, locale: 'nl_NL', type: 'website', siteName: site.naam },
  twitter: { card: 'summary_large_image' },
  robots: isPreviewDeploy ? { index: false, follow: false } : { index: true, follow: true },
  icons: { icon: [{ url: '/favicon.ico', sizes: 'any' }, { url: '/icon.svg', type: 'image/svg+xml' }], apple: '/icoon/180' },
}

/** Vangt de onschuldige AbortError van een afgebroken native paginaovergang (page-transitions L10). */
const vangAfgebrokenOvergang =
  "window.addEventListener('unhandledrejection',function(e){var r=e.reason;if(r&&r.name==='AbortError'&&/transition was skipped/i.test(String(r.message||'')))e.preventDefault();});"

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className={`${unbounded.variable} ${manrope.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: vangAfgebrokenOvergang }} />
      </head>
      <body className="min-h-dvh flex flex-col">
        <a
          href="#inhoud"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300]
                     focus:rounded-full focus:bg-tekst focus:px-5 focus:py-3 focus:text-grond"
        >
          {ui.skipLink}
        </a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema(site)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', ...personSchema(site) }) }} />
        <PageTransitions duur={320} forceerFallback={false}>{children}</PageTransitions>
        <TabTitleLokker lokzin={tabLokzin} interval={1200} />
        <Toestemming />
        {process.env.VERCEL ? <Analytics /> : null}
      </body>
    </html>
  )
}
