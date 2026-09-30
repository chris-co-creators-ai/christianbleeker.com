import { NextResponse } from 'next/server'
import { site } from '@/content/site'

/**
 * Statisch gegenereerd (force-static). Een route in plaats van `robots.ts`, omdat Next's
 * MetadataRoute.Robots geen eigen regels kent en we `Content-Signal` nodig hebben.
 *
 * Op een Vercel-preview-deploy (`VERCEL_ENV === 'preview'`, zelfde bouwtijd-check als
 * `layout.tsx`s `isPreviewDeploy`) blokkeert dit bestand ALLES — een preview-URL hoort nooit in
 * een zoekindex te belanden, welke crawler dan ook. Productie en lokaal (`npm run keuring`)
 * krijgen de normale, per-crawler regels hieronder.
 *
 * ── AI-crawlers (GEO/AEO) ────────────────────────────────────────────────────────────────────
 * Twee categorieën, met een andere standaardhouding (zie `docs/SEO.md` § "Keuzes per site"):
 *  - Zoek-/citeer-crawlers (halen een pagina op om 'm in een antwoord te citeren of te tonen in
 *    een zoekresultaat, zoals Googlebot dat al jaren doet) — ALTIJD toegestaan, schakelaar-vrij.
 *    Zonder deze crawlers vindt geen enkele AI-assistent de site nog terug.
 *  - Trainingscrawlers (halen content op om een taalmodel mee te trainen) — standaard UIT,
 *    aan te zetten per klant via `site.aiTraining` in `content/site.ts`.
 */
/*
 * Content-Signal (contentsignals.org, ook door Cloudflare gebruikt): hetzelfde besluit als de
 * crawlerlijst, maar als voorbehoud onder EU-richtlijn 2019/790 art. 4 dat ook geldt voor
 * crawlers die hieronder niet bij naam staan. search en ai-input (citeren in AI-antwoorden) aan,
 * ai-train volgt `site.aiTraining`.
 */
export const dynamic = 'force-static'

const zoekEnCiteerCrawlers = [
  'OAI-SearchBot', // OpenAI — ChatGPT-zoekresultaten
  'ChatGPT-User', // OpenAI — live opgehaald namens een ChatGPT-gebruiker
  'Claude-SearchBot', // Anthropic — Claude-zoekresultaten
  'Claude-User', // Anthropic — live opgehaald namens een Claude-gebruiker
  'PerplexityBot', // Perplexity — zoeken/citeren
]
const trainingsCrawlers = [
  'GPTBot', // OpenAI — modeltraining
  'ClaudeBot', // Anthropic — modeltraining
  'Google-Extended', // Google — training voor Gemini (los van de gewone Googlebot-indexering)
  'Applebot-Extended', // Apple — training voor Apple Intelligence (los van de gewone Applebot)
  'CCBot', // Common Crawl — voedt talloze trainingsdatasets
]

export function GET() {
  const tekst = process.env.VERCEL_ENV === 'preview'
    ? 'User-Agent: *\nDisallow: /\n'
    : [
        'User-Agent: *',
        `Content-Signal: search=yes, ai-input=yes, ai-train=${site.aiTraining ? 'yes' : 'no'}`,
        'Allow: /',
        '',
        ...zoekEnCiteerCrawlers.flatMap((ua) => [`User-Agent: ${ua}`, 'Allow: /', '']),
        ...trainingsCrawlers.flatMap((ua) => [`User-Agent: ${ua}`, site.aiTraining ? 'Allow: /' : 'Disallow: /', '']),
        `Sitemap: ${site.domein}/sitemap.xml`,
        '',
      ].join('\n')

  return new NextResponse(tekst, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
