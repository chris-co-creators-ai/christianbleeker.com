#!/usr/bin/env node
/**
 * Opleverkeuring — draait tegen de GEBOUWDE site (niet `next dev`: dat zou eigen dev-overlay-HTML
 * meenemen) en loopt alle URL's uit de eigen `sitemap.xml` langs. Faalt (exit 1) op structurele
 * SEO-/toegankelijkheids-/veiligheidsgebreken; waarschuwt (exit blijft 0) op de rest.
 *
 *   npm run keuring                        # bouwt (als nodig) en start zelf op een vrije poort
 *   node scripts/keuring.mjs --url <basis>  # tegen een al draaiende URL (bv. een preview-deploy)
 *   node scripts/keuring.mjs --sta-placeholders-toe   # negeer voorbeeldwaarden (example.com, …)
 *   node scripts/keuring.mjs --sta-ontvanger-open-toe # geen formulier-ontvanger = waarschuwing i.p.v. fout (alleen voor npm run qa)
 *   node scripts/keuring.mjs --url <preview> --bypass-secret <geheim>
 *       # door Vercel Deployment Protection heen (Project → Settings → Deployment Protection →
 *       # "Protection Bypass for Automation"). Zonder vlag wordt env VERCEL_AUTOMATION_BYPASS_SECRET
 *       # gebruikt als die bestaat.
 *
 * ── Waarom de template zelf hier NIET groen op hoeft te zijn ────────────────────────────────
 * Deze template draagt met opzet voorbeeldwaarden (`example.com`, zie `content/site.ts`) totdat
 * iemand 'm voor een echte klant invult. Zonder `--sta-placeholders-toe` faalt de keuring daar
 * dus TERECHT op — dat is het bewijs dat de placeholder-check werkt, niet een gebrek aan het
 * script. Vóór livegang (met échte content) moet `npm run keuring` gewoon groen zijn, zie
 * AGENTS.md.
 *
 * Puur regex-based HTML-lezen, geen extra dependency (jsdom/cheerio) — dezelfde aanpak als
 * `scripts/oude-site-urls.mjs` voor sitemaps. Voor de vaste, voorspelbare HTML die Next.js
 * server-side rendert is dat ruim voldoende en blijft dit script met `node` alleen draaien.
 */
import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
// `site` rechtstreeks uit de TypeScript-bron — Node 24 (zie `engines` in package.json) strip
// erasable TypeScript-syntax zelf, geen ts-node/tsx nodig (geverifieerd: `content/site.ts` bevat
// alleen type-aliassen, geen enums/namespaces). Nodig voor de FAQ-drempel-check hieronder
// (`site.faq.eigenPaginaVanaf`) — zonder dit zou de keuring moeten gokken naar welk aantal vragen
// hoort bij een wél/niet bestaande `/veelgestelde-vragen`-route.
import { site, talen } from '../src/content/site.ts'
import { TAAL_HTML_LANG, STANDAARD_TAAL } from '../src/lib/i18n.ts'
import { pingIndexNow } from './indexnow-lib.mjs'

const HIER = path.dirname(new URL(import.meta.url).pathname)
const PROJECT_ROOT = path.join(HIER, '..')

const PLACEHOLDER_PATRONEN = [
  { naam: 'example.com', patroon: /example\.com/i },
  { naam: '"lorem ipsum"', patroon: /lorem ipsum/i },
  { naam: 'TODO', patroon: /\bTODO\b/ },
]

function verdachteHost(hostname) {
  const h = hostname.toLowerCase()
  return h === 'localhost' || h.endsWith('.vercel.app') || h.includes('staging') || h.startsWith('test.') || h.startsWith('dev.')
}

function alleTags(html, tagRegex) {
  return [...html.matchAll(tagRegex)]
}

function metaTags(html, naam) {
  const regex = new RegExp(`<meta[^>]*\\bname=["']${naam}["'][^>]*>`, 'gi')
  return alleTags(html, regex).map((m) => {
    const content = m[0].match(/\bcontent=["']([^"']*)["']/i)
    return content ? content[1] : ''
  })
}

// ── Meertaligheid (toegevoegd 27-09-2026, zie docs/SEO.md § 2) ─────────────────────────────────
// `talen`/`TAAL_HTML_LANG`/`STANDAARD_TAAL` komen uit dezelfde bron als de site zelf (`content/
// site.ts`/`src/lib/i18n.ts`) — geen aparte lijst hier die uit de pas kan lopen.

/** `<html lang="...">`-waarde van een pagina, of `null` als het attribuut ontbreekt (aparte,
 *  bestaande check hieronder in `keurEnkelePagina`). */
function htmlLangVan(html) {
  const m = html.match(/<html[^>]*\blang=["']([a-zA-Z-]+)["']/i)
  return m ? m[1] : null
}

/** Elke `<link rel="alternate" hreflang="...">` op de pagina, met zijn `href`. Werkt met attributen
 *  in beide volgordes (`hreflang` vóór of ná `href`) — Next.js rendert ze zelf in een vaste
 *  volgorde, maar deze regex gaat er niet van uit. */
function hreflangTags(html) {
  return alleTags(html, /<link\b[^>]*>/gi)
    .map((m) => m[0])
    .filter((tag) => /\brel=["']alternate["']/i.test(tag) && /\bhreflang=["'][^"']+["']/i.test(tag))
    .map((tag) => ({
      hreflang: tag.match(/\bhreflang=["']([^"']+)["']/i)[1],
      href: tag.match(/\bhref=["']([^"']+)["']/i)?.[1] ?? '',
    }))
}

/** Taal uit een pad afgeleid (`/en/artikelen` → `'en'`, `/artikelen` → `'nl'`) — puur op de
 *  geconfigureerde `talen`-lijst, geen aparte hardcoded taalcode-lijst. */
function taalUitPad(pad) {
  const eerste = pad.split('/').filter(Boolean)[0]
  return eerste && talen.includes(eerste) && eerste !== STANDAARD_TAAL ? eerste : STANDAARD_TAAL
}

/** Het pad ZONDER taalprefix — de sleutel waarop paden in verschillende talen bij elkaar horen
 *  (`/en/artikelen/x` en `/artikelen/x` horen allebei bij `/artikelen/x`). */
function logischPad(pad, taal) {
  if (taal === STANDAARD_TAAL) return pad || '/'
  const rest = pad.slice(`/${taal}`.length)
  return rest === '' ? '/' : rest
}

// Zichtbare tekst van een pagina, zonder <script>/<style>-inhoud en zonder tags — gebruikt om te
// controleren of een `FAQPage`-vraag ook echt als leesbare content op dezelfde pagina staat (niet
// alleen in het JSON-LD-blok zelf, dat de vraagtekst ALTIJD bevat en dus geen bruikbare test is).
// Decodeert alleen de entities die React/Next hier daadwerkelijk uitstuurt (geen volledige
// HTML-entity-tabel nodig voor dit doel).
function zichtbareTekst(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
}

// "Waarschuwing" (ernst: 'waarschuwing', geen exit 1): meldt iets wat de keuring bewust niet kan
// beoordelen. Eerste geval (25-09-2026): een preview-deploy die met robots.txt alles blokkeert.
function fout(tekst) {
  return { ernst: 'fout', tekst }
}
function waarschuwing(tekst) {
  return { ernst: 'waarschuwing', tekst }
}

/** Beoordeelt de HTML van één pagina op zichzelf staand (geen kennis van andere pagina's).
 *  `pad` (het URL-pad, bv. `/en/artikelen/x`) is nodig voor de `lang`-matchcheck hieronder —
 *  optioneel, want `keurSitebreed` roept dit soort checks nooit los per pad aan. */
function keurEnkelePagina(html, pad = '') {
  const bevindingen = []

  // <title> — precies één, geen duplicaat op dezelfde pagina.
  const titles = alleTags(html, /<title>([\s\S]*?)<\/title>/gi).map((m) => m[1].trim())
  if (titles.length === 0) bevindingen.push(fout('geen <title>'))
  else if (titles.length > 1) bevindingen.push(fout(`${titles.length}× <title> op één pagina (dubbel)`))
  const title = titles[0]

  // meta description — precies één, tussen 50 en 160 tekens (te kort zegt zelfs Google te
  // weinig om iets mee te doen; te lang knipt-ie toch af).
  const descripties = metaTags(html, 'description')
  if (descripties.length === 0) bevindingen.push(fout('geen meta description'))
  else if (descripties.length > 1) bevindingen.push(fout(`${descripties.length}× meta description op één pagina (dubbel)`))
  const beschrijving = descripties[0]
  if (beschrijving && beschrijving.length > 160) {
    bevindingen.push(fout(`meta description is ${beschrijving.length} tekens (> 160)`))
  }
  if (beschrijving && beschrijving.length > 0 && beschrijving.length < 50) {
    bevindingen.push(fout(`meta description is maar ${beschrijving.length} tekens (< 50)`))
  }

  // <title> — max ~70 tekens (Google knipt boven ongeveer die pixelbreedte af).
  if (title && title.length > 70) {
    bevindingen.push(fout(`<title> is ${title.length} tekens (> 70)`))
  }

  // twitter:card — zonder deze meta valt een gedeelde link terug op een kale linkkaart i.p.v.
  // een grote afbeelding, ook als er wél een og:image is (X/Twitter leest primair de eigen
  // twitter:*-meta's).
  if (!/<meta[^>]*\bname=["']twitter:card["'][^>]*>/i.test(html)) {
    bevindingen.push(fout('geen meta name="twitter:card"'))
  }

  // JSON-LD — minstens één blok, en elk blok moet geldige JSON zijn (een kapot script-blok is
  // voor een crawler hetzelfde als geen structured data).
  const jsonLdBlokken = alleTags(html, /<script[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    .map((m) => m[1])
  if (jsonLdBlokken.length === 0) {
    bevindingen.push(fout('geen JSON-LD (application/ld+json) op de pagina'))
  }
  let heeftFaqPage = false
  for (const blok of jsonLdBlokken) {
    let data
    try {
      data = JSON.parse(blok)
    } catch {
      bevindingen.push(fout('een JSON-LD-blok op deze pagina is geen geldige JSON'))
      continue
    }
    // Eén JSON-LD-`<script>` mag zowel één object (Organization, FAQPage, …) als een array
    // dragen (deze template stuurt bv. een array `Service`-objecten uit voor de aanbod-blokken,
    // zie `app/page.tsx`) — op beide vormen checken.
    const items = Array.isArray(data) ? data : [data]
    for (const item of items) {
      if (!item || item['@type'] !== 'FAQPage') continue
      heeftFaqPage = true
      const zichtbaar = zichtbareTekst(html)
      const vragen = Array.isArray(item.mainEntity) ? item.mainEntity : []
      for (const vraag of vragen) {
        const tekst = vraag?.name
        if (typeof tekst === 'string' && tekst && !zichtbaar.includes(tekst)) {
          bevindingen.push(fout(`FAQPage-vraag staat niet als zichtbare tekst op dezelfde pagina: "${tekst}"`))
        }
      }
    }
  }

  // Skip-link (KWALITEITSREGELS R21): de eerste link in <body> springt naar een anker dat op
  // DEZE pagina bestaat. Een link naar #top die alleen op de homepage bestaat, telt niet.
  const bodyHtml = html.split(/<body[^>]*>/i)[1] ?? ''
  const eersteLink = bodyHtml.match(/<a\s[^>]*href="([^"]*)"/i)
  const skipDoel = eersteLink?.[1]?.startsWith('#') ? eersteLink[1].slice(1) : null
  if (!skipDoel) {
    bevindingen.push(fout('geen skip-link ("naar de inhoud") als eerste link in <body>'))
  } else if (!new RegExp(`\\sid="${skipDoel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(html)) {
    bevindingen.push(fout(`skip-link wijst naar #${skipDoel}, maar dat anker staat niet op deze pagina`))
  }

  // Precies één <h1>.
  const h1Aantal = alleTags(html, /<h1[\s>]/gi).length
  if (h1Aantal !== 1) bevindingen.push(fout(`${h1Aantal}× <h1> op de pagina (verwacht: precies 1)`))

  // <img> zonder alt.
  const imgs = alleTags(html, /<img\b[^>]*>/gi).map((m) => m[0])
  const imgsZonderAlt = imgs.filter((tag) => !/\balt\s*=/i.test(tag))
  if (imgsZonderAlt.length > 0) bevindingen.push(fout(`${imgsZonderAlt.length}× <img> zonder alt-attribuut`))

  // canonical.
  if (!/<link[^>]*\brel=["']canonical["'][^>]*>/i.test(html)) {
    bevindingen.push(fout('geen <link rel="canonical">'))
  }

  // lang op <html> — moet bestaan, en (meertaligheid, docs/SEO.md § 2) overeenkomen met de taal
  // die uit het pad zelf volgt (`/en/...` → `en`, alles zonder taalprefix → `nl`).
  const htmlLang = htmlLangVan(html)
  if (!htmlLang) {
    bevindingen.push(fout('<html> mist het lang-attribuut'))
  } else if (pad) {
    const verwachteTaal = taalUitPad(pad)
    const verwachteLang = TAAL_HTML_LANG[verwachteTaal]
    if (htmlLang !== verwachteLang) {
      bevindingen.push(fout(`<html lang="${htmlLang}">, maar het pad ${pad} hoort bij taal "${verwachteLang}"`))
    }
  }

  // hreflang — alleen op deze pagina zelf te checken: bestaat er meer dan één taal, dan moet elke
  // hreflang-tag naar een geldig, bekend taalcode + x-default wijzen (compleetheid/wederkerigheid
  // tussen pagina's is een site-brede check, zie `keurHreflangSiteBreed` hieronder).
  const hreflang = hreflangTags(html)
  if (talen.length <= 1 && hreflang.length > 0) {
    bevindingen.push(fout(`${hreflang.length}× hreflang-tag op een pagina terwijl er maar 1 taal geconfigureerd is (site.talen)`))
  }
  const bekendeHreflangCodes = new Set([...talen.map((t) => TAAL_HTML_LANG[t]), 'x-default'])
  for (const { hreflang: code } of hreflang) {
    if (!bekendeHreflangCodes.has(code)) {
      bevindingen.push(fout(`hreflang="${code}" is geen geconfigureerde taal en geen x-default`))
    }
  }

  // Dubbele trackingscripts — elk type hoort hooguit 1× voor te komen.
  const trackingTellingen = {
    'GA4 (gtag)': (html.match(/googletagmanager\.com\/gtag\/js/gi) || []).length,
    'Google Tag Manager': (html.match(/googletagmanager\.com\/gtm\.js/gi) || []).length,
    'Microsoft Clarity': (html.match(/clarity\.ms\/tag/gi) || []).length,
  }
  for (const [naam, aantal] of Object.entries(trackingTellingen)) {
    if (aantal > 1) bevindingen.push(fout(`${naam}-script komt ${aantal}× voor op één pagina (dubbel)`))
  }

  // Voorbeeldtekst die is blijven staan.
  for (const { naam, patroon } of PLACEHOLDER_PATRONEN) {
    if (patroon.test(html)) bevindingen.push({ ernst: 'placeholder', tekst: `voorbeeldwaarde ${naam} staat nog in de pagina` })
  }

  // Links — voor de host-check hier; de 404-check gebeurt op siteniveau (heeft de basis-URL nodig
  // om relatieve links op te lossen en resultaten tussen pagina's te cachen).
  const hrefs = alleTags(html, /<a\b[^>]*\shref=["']([^"']+)["']/gi).map((m) => m[1])
  for (const href of hrefs) {
    if (!/^https?:\/\//i.test(href)) continue
    try {
      const { hostname } = new URL(href)
      if (verdachteHost(hostname)) bevindingen.push(fout(`link naar verdacht domein: ${href}`))
    } catch {
      // geen geldige URL — negeren, dat is geen host-probleem.
    }
  }

  return { title, beschrijving, hrefs, heeftFaqPage, hreflang, htmlLang, bevindingen }
}

/** Lost een gevonden href op tot een intern pad (of `null` als het extern/geen-link is). */
function internPad(href, basis) {
  if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return null
  try {
    const url = new URL(href, basis)
    if (url.origin !== basis) return null
    return url.pathname + url.search
  } catch {
    return null
  }
}

async function keurSite(basis, { staPlaceholdersToe }) {
  const sitemapRes = await fetch(`${basis}/sitemap.xml`)
  // Deployment Protection stuurt zonder sleutel door naar vercel.com/sso-api (dan 200 met een
  // inlogpagina) of geeft 401/403 — beide keuren anders een inlogpagina in plaats van de site.
  const omgeleidNaarElders = sitemapRes.url && new URL(sitemapRes.url).origin !== new URL(basis).origin
  if (omgeleidNaarElders || sitemapRes.status === 401 || sitemapRes.status === 403) {
    throw new Error(
      `sitemap.xml op ${basis} gaf ${sitemapRes.status}${omgeleidNaarElders ? ` na doorsturen naar ${new URL(sitemapRes.url).host}` : ''} — waarschijnlijk Vercel Deployment Protection. ` +
        'Geef --bypass-secret <geheim> mee (of zet VERCEL_AUTOMATION_BYPASS_SECRET).',
    )
  }
  if (!sitemapRes.ok) throw new Error(`sitemap.xml niet bereikbaar op ${basis} (status ${sitemapRes.status})`)
  const sitemapXml = await sitemapRes.text()
  const paden = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)

  const paginas = []
  const titelNaarPaden = new Map()
  const faqPagePaden = []
  const statusCache = new Map()
  // Voor de site-brede hreflang-compleetheids-/wederkerigheidscheck hieronder: elk bezocht pad met
  // zijn hreflang-tags erbij.
  const hreflangPerPad = new Map()

  async function statusVan(pad) {
    if (statusCache.has(pad)) return statusCache.get(pad)
    const res = await fetch(`${basis}${pad}`, { redirect: 'follow' })
    statusCache.set(pad, res.status)
    return res.status
  }

  for (const pad of paden) {
    const res = await fetch(`${basis}${pad}`)
    const html = await res.text()
    const { title, hrefs, heeftFaqPage, hreflang, bevindingen } = keurEnkelePagina(html, pad)

    if (title) {
      titelNaarPaden.set(title, [...(titelNaarPaden.get(title) || []), pad])
    }
    if (heeftFaqPage) faqPagePaden.push(pad)
    hreflangPerPad.set(pad, hreflang)

    // Interne links die 404 geven.
    const interneHrefs = [...new Set(hrefs.map((h) => internPad(h, basis)).filter(Boolean))]
    for (const doelPad of interneHrefs) {
      const status = await statusVan(doelPad)
      if (status === 404) bevindingen.push(fout(`interne link geeft 404: ${doelPad}`))
    }

    paginas.push({ pad, status: res.status, bevindingen: staPlaceholdersToe ? bevindingen.filter((b) => b.ernst !== 'placeholder') : bevindingen })
  }

  // Hreflang-compleetheid + wederkerigheid over de hele site: paden met dezelfde "logische" naam
  // (zonder taalprefix) horen allemaal naar elkaar + x-default te wijzen, met precies de
  // geconfigureerde talenset — geen ontbrekende, geen extra, geen kapotte kruisverwijzing.
  const logischeGroepen = new Map()
  for (const pad of paden) {
    const taal = taalUitPad(pad)
    const sleutel = logischPad(pad, taal)
    if (!logischeGroepen.has(sleutel)) logischeGroepen.set(sleutel, [])
    logischeGroepen.get(sleutel).push({ pad, taal })
  }
  for (const [sleutel, leden] of logischeGroepen) {
    if (talen.length <= 1 || leden.length <= 1) continue
    const verwachteCodes = new Set([...talen.map((t) => TAAL_HTML_LANG[t]), 'x-default'])
    // Vergelijkt tegen `site.domein` (de productie-URL uit `content/site.ts`, dezelfde bron als
    // Next.js se eigen `metadataBase`), NIET tegen `basis` (de testserver — localhost of een
    // preview-URL): canonical/hreflang wijzen altijd naar het echte domein, ook als de keuring
    // lokaal of tegen een preview draait. `basis` blijft alleen de plek waar dit script zelf
    // fetcht. NL-home is `site.domein` zonder trailing slash (zelfde speciale geval als
    // `urlVoor` in `app/sitemap.ts`) — `pad` is hier altijd `/` (uit `new URL(...).pathname`).
    const verwachteHrefPerCode = new Map(
      [...verwachteCodes].map((code) => {
        const taal = code === 'x-default' ? STANDAARD_TAAL : talen.find((t) => TAAL_HTML_LANG[t] === code)
        const lid = leden.find((l) => l.taal === taal)
        if (!lid) return [code, null]
        const href = taal === STANDAARD_TAAL && lid.pad === '/' ? site.domein : `${site.domein}${lid.pad}`
        return [code, href]
      }),
    )
    for (const { pad } of leden) {
      const pagina = paginas.find((p) => p.pad === pad)
      const eigenHreflang = hreflangPerPad.get(pad) ?? []
      const codesOpPagina = new Set(eigenHreflang.map((h) => h.hreflang))
      for (const code of verwachteCodes) {
        if (!codesOpPagina.has(code)) {
          pagina.bevindingen.push(fout(`hreflang="${code}" ontbreekt op ${pad} (logische pagina "${sleutel}")`))
        }
      }
      for (const { hreflang: code, href } of eigenHreflang) {
        const verwachteHref = verwachteHrefPerCode.get(code)
        if (verwachteHref && href !== verwachteHref) {
          pagina.bevindingen.push(fout(`hreflang="${code}" op ${pad} wijst naar ${href}, verwacht ${verwachteHref}`))
        }
      }
    }
  }

  // Zelfde title op meerdere pagina's — apart van "dubbel op één pagina" hierboven. Uitzondering
  // (meertaligheid, docs/SEO.md § 2): paden die precies de talenvertaling van elkaar zijn (zelfde
  // logische pagina, andere taalprefix — bv. `/`, `/en`, `/de` delen bewust de sitenaam als title)
  // horen hier niet als "dubbel" gemeld te worden — dat is precies de bedoeling van hreflang.
  for (const [title, padsMetDezeTitle] of titelNaarPaden) {
    if (padsMetDezeTitle.length <= 1) continue
    const logischeSleutels = new Set(padsMetDezeTitle.map((p) => logischPad(p, taalUitPad(p))))
    if (logischeSleutels.size === 1) continue // allemaal elkaars vertaling — geen dubbel
    for (const pad of padsMetDezeTitle) {
      const pagina = paginas.find((p) => p.pad === pad)
      pagina.bevindingen.push(fout(`title "${title}" komt ook voor op: ${padsMetDezeTitle.filter((p) => p !== pad).join(', ')}`))
    }
  }

  // `FAQPage`-schema op meer dan één pagina — regel: nooit tegelijk op de
  // homepage én op `/veelgestelde-vragen` (zie `docs/SEO.md` § 10, `app/page.tsx`,
  // `app/veelgestelde-vragen/page.tsx`). Per TAAL gecontroleerd (meertaligheid, docs/SEO.md § 2):
  // elke taal draagt z'n eigen `FAQPage`-schema, dus `/`, `/en` én `/de` samen is geen overtreding
  // — wél zou `/en` én `/en/veelgestelde-vragen` tegelijk dat schema dragen een overtreding zijn.
  const faqPagePadenPerTaal = new Map()
  for (const pad of faqPagePaden) {
    const taal = taalUitPad(pad)
    if (!faqPagePadenPerTaal.has(taal)) faqPagePadenPerTaal.set(taal, [])
    faqPagePadenPerTaal.get(taal).push(pad)
  }
  for (const [, padenVoorTaal] of faqPagePadenPerTaal) {
    if (padenVoorTaal.length > 1) {
      for (const pad of padenVoorTaal) {
        const pagina = paginas.find((p) => p.pad === pad)
        pagina.bevindingen.push(fout(`FAQPage-schema staat op meer dan één pagina: ${padenVoorTaal.join(', ')}`))
      }
    }
  }

  paginas.push(await keurSitebreed(basis, sitemapXml, paden))

  return paginas
}

/** Checks die niet over één pagina gaan maar over de site als geheel — sitemap-lastmod,
 *  robots.txt en de llms.txt-tweeling. Komt als eigen rij in het rapport terecht (pad
 *  "(site-breed)"), zodat `printRapport`/de exit-code er ongewijzigd mee omgaan. */
async function keurSitebreed(basis, sitemapXml, paden) {
  const bevindingen = []

  // Elke <url> in de sitemap hoort een <lastmod> te hebben.
  const urlAantal = (sitemapXml.match(/<url>/g) || []).length
  const lastmodAantal = (sitemapXml.match(/<lastmod>/g) || []).length
  if (lastmodAantal < urlAantal) {
    bevindingen.push(fout(`sitemap.xml: ${urlAantal} <url>, maar ${lastmodAantal} <lastmod>`))
  }

  // robots.txt — alleen een existentie-check op de AI-crawler-regels (welke kant de schakelaar op
  // staat is een klantkeuze, geen keuringsfout); de site-brede blokkade op preview-deploys is een
  // aparte, expliciete tak in `robots.txt/route.ts` en wordt hier niet herhaald.
  const robotsRes = await fetch(`${basis}/robots.txt`)
  const robotsTxt = robotsRes.ok ? await robotsRes.text() : ''
  // Preview-deploys blokkeren bewust alles (`robots.txt/route.ts`, VERCEL_ENV === 'preview'). Dat is dan
  // goed, geen fout — anders faalt elke preview-uitrol op zijn eigen keuring. Op productie is
  // een volledige blokkade juist de ergste fout die er is.
  const blokkeertAlles = /User-Agent:\s*\*\s*\n\s*Disallow:\s*\/\s*$/im.test(robotsTxt) && !/^Allow:\s*\/\s*$/im.test(robotsTxt)
  if (!robotsRes.ok) bevindingen.push(fout(`robots.txt niet bereikbaar (status ${robotsRes.status})`))
  else if (blokkeertAlles) {
    if (process.env.VERCEL_ENV === 'production') {
      bevindingen.push(fout('robots.txt blokkeert alle crawlers op PRODUCTIE'))
    } else {
      bevindingen.push(waarschuwing('robots.txt blokkeert alles (preview-deploy) — AI-crawlerregels hier niet gekeurd'))
    }
  } else if (!/GPTBot/i.test(robotsTxt) || !/OAI-SearchBot/i.test(robotsTxt)) {
    bevindingen.push(fout('robots.txt mist de AI-crawler-regels (verwacht o.a. GPTBot, OAI-SearchBot)'))
  }

  // Formulier-ontvanger: de site heeft een contactformulier, dus zonder ontvanger gaat een bericht
  // verloren. Leeg of ongeldig = rood tot de klant een adres levert (regel van deze site).
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(site.mail?.naar || '') || /\.invalid$/i.test(site.mail?.naar || '')) {
    bevindingen.push((process.argv.includes('--sta-ontvanger-open-toe') ? waarschuwing : fout)('formulier-ontvanger: site.mail.naar is leeg of ongeldig — het contactformulier kan niets afleveren'))
  }

  // llms.txt / llms-full.txt — allebei bereikbaar en niet leeg.
  for (const pad of ['/llms.txt', '/llms-full.txt']) {
    const res = await fetch(`${basis}${pad}`)
    if (!res.ok) { bevindingen.push(fout(`${pad} niet bereikbaar (status ${res.status})`)); continue }
    const tekst = await res.text()
    if (tekst.trim().length < 50) bevindingen.push(fout(`${pad} is (bijna) leeg`))
  }

  // Elk pad uit de sitemap hoort ook echt te bestaan (aparte check van de per-pagina 404-check
  // hierboven, die alleen interne <a>-links volgt, niet de sitemap zelf).
  for (const pad of paden) {
    const res = await fetch(`${basis}${pad}`)
    if (res.status === 404) bevindingen.push(fout(`sitemap.xml wijst naar een 404: ${pad}`))
  }

  // `/veelgestelde-vragen` hoort alleen te bestaan boven de FAQ-drempel (`site.faq.
  // eigenPaginaVanaf`, zie `docs/SEO.md` § 10) — t/m de drempel staat de
  // FAQ alleen als sectie op de homepage en geeft die route een 404 (`notFound()` in de pagina
  // zelf). Beide kanten van die afspraak zijn een fout: bestaat terwijl het aantal ≤ de drempel
  // is (het oorspronkelijke gevraagde geval), of ontbreekt terwijl het aantal wél boven de
  // drempel ligt (dezelfde afspraak, andere richting — dezelfde statuscheck levert 'm gratis op).
  const faqRes = await fetch(`${basis}/veelgestelde-vragen`)
  const faqBovenDrempel = site.faq.items.length > site.faq.eigenPaginaVanaf
  if (!faqBovenDrempel && faqRes.status !== 404) {
    bevindingen.push(fout(
      `/veelgestelde-vragen bestaat (status ${faqRes.status}) terwijl er maar ${site.faq.items.length} `
      + `vraag/vragen zijn — niet boven de drempel (faq.eigenPaginaVanaf=${site.faq.eigenPaginaVanaf})`,
    ))
  }
  if (faqBovenDrempel && faqRes.status === 404) {
    bevindingen.push(fout(
      `/veelgestelde-vragen ontbreekt (404) terwijl er ${site.faq.items.length} vragen zijn — `
      + `boven de drempel (faq.eigenPaginaVanaf=${site.faq.eigenPaginaVanaf})`,
    ))
  }

  return { pad: '(site-breed)', status: 200, bevindingen }
}

function printRapport(paginas) {
  let fouten = 0
  let waarschuwingen = 0
  for (const { pad, status, bevindingen } of paginas) {
    console.log(`\n${pad} (${status})`)
    if (bevindingen.length === 0) {
      console.log('  OK')
      continue
    }
    for (const b of bevindingen) {
      const label = b.ernst === 'fout' ? 'FOUT' : b.ernst === 'placeholder' ? 'PLACEHOLDER' : 'WAARSCHUWING'
      console.log(`  ${label}: ${b.tekst}`)
      if (b.ernst === 'fout' || b.ernst === 'placeholder') fouten += 1
      else waarschuwingen += 1
    }
  }
  console.log(`\n${paginas.length} pagina's gekeurd — ${fouten} fout(en), ${waarschuwingen} waarschuwing(en).`)
  return fouten
}

function runCmd(bin, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { cwd, stdio: 'inherit' })
    proc.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${bin} ${args.join(' ')} gaf exit ${code}`))))
  })
}

async function startGebouwdeSite() {
  const nextBin = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'next')
  const buildIdPad = path.join(PROJECT_ROOT, '.next', 'BUILD_ID')
  if (!existsSync(buildIdPad)) {
    console.log('Geen build gevonden — npm run build …')
    await runCmd(nextBin, ['build'], PROJECT_ROOT)
  }
  const proc = spawn(nextBin, ['start', '-p', '0'], { cwd: PROJECT_ROOT, stdio: ['ignore', 'pipe', 'pipe'] })
  const url = await new Promise((resolve, reject) => {
    let buffer = ''
    const timeout = setTimeout(() => reject(new Error('next start gaf geen URL binnen 30s')), 30_000)
    proc.stdout.on('data', (chunk) => {
      buffer += chunk.toString()
      const match = buffer.match(/Local:\s+(http:\/\/\S+)/)
      if (match) {
        clearTimeout(timeout)
        resolve(match[1].replace(/\/$/, ''))
      }
    })
    proc.stderr.on('data', (chunk) => process.stderr.write(chunk))
    proc.once('exit', (code) => {
      clearTimeout(timeout)
      reject(new Error(`next start stopte vroegtijdig (exit ${code})`))
    })
  })
  return {
    url,
    stop: () =>
      new Promise((resolve) => {
        proc.once('exit', resolve)
        proc.kill('SIGTERM')
      }),
  }
}

async function main() {
  const args = process.argv.slice(2)
  const staPlaceholdersToe = args.includes('--sta-placeholders-toe')
  const urlIndex = args.indexOf('--url')
  const gegevenUrl = urlIndex !== -1 ? args[urlIndex + 1] : undefined
  const bypassIndex = args.indexOf('--bypass-secret')
  const bypassSecret =
    (bypassIndex !== -1 ? args[bypassIndex + 1] : undefined) || process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  if (bypassSecret) {
    // Eén plek: elke fetch in dit script krijgt de bypass-header, ook redirects binnen dezelfde host.
    const kaleFetch = globalThis.fetch
    globalThis.fetch = (invoer, opties = {}) =>
      kaleFetch(invoer, {
        ...opties,
        headers: { ...(opties.headers || {}), 'x-vercel-protection-bypass': bypassSecret },
      })
  }

  let basis = gegevenUrl
  let stopServer = null
  if (!basis) {
    console.log('Geen --url meegegeven — eigen server starten op een vrije poort …')
    const gestart = await startGebouwdeSite()
    basis = gestart.url
    stopServer = gestart.stop
    console.log(`Server draait op ${basis}`)
  }

  try {
    const paginas = await keurSite(basis, { staPlaceholdersToe })
    const fouten = printRapport(paginas)
    process.exitCode = fouten > 0 ? 1 : 0

    // IndexNow — alleen ná een groene keuring op PRODUCTIE (zie `indexnow-lib.mjs` en
    // `docs/SEO.md` § 8): een falende ping mag de uitrol nooit blokkeren, dus altijd afvangen en
    // nooit `process.exitCode` aanraken.
    if (fouten === 0) {
      try {
        const paden = paginas.filter((p) => p.pad !== '(site-breed)').map((p) => p.pad)
        const resultaat = await pingIndexNow({
          domein: site.domein,
          paden,
          vercelEnv: process.env.VERCEL_ENV,
          publicDir: path.join(PROJECT_ROOT, 'public'),
        })
        console.log(
          resultaat.gepingd
            ? `\nIndexNow: ${resultaat.aantalUrls} URL('s) gemeld, antwoord ${resultaat.status}.`
            : `\nIndexNow: ${resultaat.reden}.`,
        )
      } catch (fout) {
        console.warn('\nIndexNow-ping mislukt (uitrol gaat gewoon door):', fout instanceof Error ? fout.message : fout)
      }
    }
  } finally {
    if (stopServer) await stopServer()
  }
}

main().catch((fout) => {
  console.error('Keuring kon niet draaien:', fout)
  process.exitCode = 1
})
