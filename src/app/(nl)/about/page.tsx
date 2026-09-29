import type { Metadata } from 'next'
import { Kop } from '@/components/secties/Kop'
import { Voet } from '@/components/secties/Voet'
import { Beeld } from '@/components/Beeld'
import { Dock } from '@/components/Dock'
import { over } from '@/content/teksten'
import { cases } from '@/content/cases'
import { site } from '@/content/site'
import { breadcrumbSchema, videoSchema } from '@/lib/schema'
import { BeeldLetters } from '@/features/beeld-letters/BeeldLetters'
import { Marquee } from '@/features/marquee/MarqueeBand'
import { KrachtveldLogowand } from '@/features/krachtveld-logowand/KrachtveldLogowand'
import { FlipLightbox } from '@/features/flip-lightbox/FlipLightbox'
import { VideoFacade } from '@/features/video-facade/VideoFacade'
import { RevealOnScroll } from '@/features/reveal-on-scroll/RevealOnScroll'

export const metadata: Metadata = {
  title: { absolute: over.titel },
  description: over.beschrijving,
  alternates: { canonical: '/about' },
  openGraph: { title: over.titel, description: over.beschrijving, url: '/about' },
}

/** Logo per case: svg waar de bron een svg had, anders webp. */
const LOGO: Record<string, string> = {
  'offbeat-peak': 'logo-offbeat-peak.webp', 'digital-waves': 'logo-digital-waves.svg', driftawave: 'logo-driftawave.svg',
  'radstok-interim': 'logo-radstok-interim.svg', fuselabs: 'logo-fuselabs.webp', 'souplesse-runners-boutique': 'logo-souplesse.svg',
  'kinderopvang-ikke': 'logo-kinderopvang-ikke.webp', 'win-instituut': 'logo-win-instituut.webp', 'co-creatie-ai': 'co-creatie.webp',
}

/** Echte maten van de aanbevelingen (geen verspringing tijdens het laden). */
const MAAT: Record<string, [number, number]> = {
  sven: [776, 284], gina: [788, 417], els: [786, 343], annemieke: [778, 415], bernard: [781, 407], edwin: [776, 179], ela: [778, 299],
}

export default function Over() {
  const { tedx, denktank, podcast } = over.gesprek
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([{ naam: 'Home', url: site.domein }, { naam: over.kop, url: `${site.domein}/about` }])) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema({ naam: tedx.titel, beschrijving: `${site.naam} — TEDxEindhoven`, youtube: tedx.youtube })) }}
      />
      <Kop pad="/about" />
      <main id="inhoud" tabIndex={-1} className="outline-none flex-1">
        <section className="over-kop container-site">
          <BeeldLetters woord={over.kop} beeld="/beeld/chris-duimen-900.webp" terug="#f0533a" beweging="drijf" kopClassName="over-h1" className="over-letters" />
        </section>

        <RevealOnScroll once threshold={0.01} rootMargin="0px 0px -6% 0px">
          <section className="sectie container-site verhaal">
            <div className="beeld verhaal-foto" data-reveal="left">
              <Beeld naam="team-chris" breedte={526} hoogte={736} alt={over.portretAlt} prioriteit />
            </div>
            <div className="verhaal-tekst">
              {over.alineas.map((a, i) => (
                <p key={i} className={i === 0 ? 'verhaal-eerste' : undefined} data-reveal="">{a}</p>
              ))}
              <a className="knop" href="/contact" data-reveal="">{over.knop} <span className="pijl" aria-hidden="true">→</span></a>
            </div>
          </section>

          <section className="bekend" aria-labelledby="bekend-kop">
            <div className="container-site">
              <h2 id="bekend-kop" className="bekend-kop"><span className="x" aria-hidden="true">×</span> {over.bekendVan.kop}</h2>
            </div>
            <Marquee variant="logos" speed={40} className="bekend-band">
              {[...over.bekendVan.namen, ...over.bekendVan.namen].map((n, i) => (
                <span key={i} className="bekend-item" aria-hidden={i >= over.bekendVan.namen.length ? 'true' : undefined}>
                  <span className="bekend-logo"><Beeld naam={n.beeld} breedte={120} hoogte={120} alt="" /></span>
                  <span>{n.naam}</span>
                </span>
              ))}
            </Marquee>
          </section>

          <section className="logowand" aria-labelledby="websites-kop">
            <div className="container-site">
              <h2 id="websites-kop" className="logowand-kop" data-reveal="">{over.websites.kop}</h2>
              <KrachtveldLogowand
                thema="licht"
                href="/work"
                label={over.websites.schijf}
                knopTekst={over.websites.schijf}
                ringTekst={over.websites.ring}
                lijstLabel={over.websites.kop}
                logos={cases.map((c) => ({ alt: c.naam, src: `/beeld/${LOGO[c.slug]}` }))}
              />
            </div>
          </section>

          <section className="sectie container-site" aria-labelledby="ervaringen-kop">
            <div className="sectie-kop" data-reveal="">
              <h2 id="ervaringen-kop">{over.ervaringen.kop}</h2>
              <p className="sectie-tekst">{over.ervaringen.hint}</p>
            </div>
            <FlipLightbox className="ervaringen">
              {over.ervaringen.namen.map(([bestand, naam]) => (
                <a
                  key={bestand}
                  className="ervaring beeld"
                  data-lightbox=""
                  href={`/beeld/aanbeveling-${bestand}.webp`}
                  data-alt={over.ervaringen.alt(naam)}
                  data-caption={naam}
                >
                  <Beeld naam={`aanbeveling-${bestand}`} breedte={MAAT[bestand][0]} hoogte={MAAT[bestand][1]} alt={over.ervaringen.alt(naam)} />
                </a>
              ))}
            </FlipLightbox>
          </section>

          <section className="sectie container-site" aria-labelledby="gesprek-kop">
            <div className="sectie-kop" data-reveal="">
              <h2 id="gesprek-kop">{over.gesprek.kop}</h2>
            </div>
            <VideoFacade className="gesprek">
              {[{ ...tedx, poster: '/beeld/tedx-1280.webp' }, { ...denktank, poster: '/beeld/denktank.webp' }].map((v) => (
                <figure key={v.youtube} className="gesprek-item" data-reveal="">
                  <div className="vf" data-video-facade="" data-provider="youtube" data-id={v.youtube} data-title={v.titel}>
                    <a className="vf__fallback" data-vf-fallback="" href={`https://www.youtube.com/watch?v=${v.youtube}`}>
                      <img src={v.poster} alt="" width={1280} height={720} loading="lazy" />
                    </a>
                  </div>
                  <figcaption>{v.titel}</figcaption>
                </figure>
              ))}
              <figure className="gesprek-item gesprek-podcast" data-reveal="">
                <a className="beeld podcast-link" href={podcast.href} target="_blank" rel="noopener noreferrer">
                  <Beeld naam="podcast" breedte={544} hoogte={617} alt="" />
                  <span className="knop knop--mint">{podcast.knop}</span>
                </a>
                <figcaption>{podcast.titel}</figcaption>
              </figure>
            </VideoFacade>
            <p className="denk" data-reveal="">
              <a className="link" href={over.bekendVan.namen[0].href} target="_blank" rel="noopener noreferrer">{over.bekendVan.namen[0].naam} ↗</a>
            </p>
          </section>
        </RevealOnScroll>
      </main>
      <Voet />
      <Dock />
    </>
  )
}
