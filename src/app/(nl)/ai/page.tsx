import type { Metadata } from 'next'
import { og } from '@/lib/og-velden'
import { Kop } from '@/components/secties/Kop'
import { Voet } from '@/components/secties/Voet'
import { Beeld } from '@/components/Beeld'
import { ChecklistKnop } from '@/components/ChecklistKnop'
import { Dock } from '@/components/Dock'
import { ai, over, home } from '@/content/teksten'
import { site } from '@/content/site'
import { breadcrumbSchema, videoSchema } from '@/lib/schema'
import { VideoFacade } from '@/features/video-facade/VideoFacade'
import { RevealOnScroll } from '@/features/reveal-on-scroll/RevealOnScroll'
import { VoorNaVerhaal } from '@/features/voor-na-verhaal/VoorNaVerhaal'
import { KaartenrijLottie } from '@/features/kaartenrij-lottie/KaartenrijLottie'
import { ImpactScan, type ImpactScanConfig } from '@/features/impact-scan/ImpactScan'
import { PasswordReveal } from '@/features/password-reveal/PasswordReveal'
import { DiepteBeeld } from '@/features/diepte-beeld/DiepteBeeld'
import { EyebrowLijn } from '@/features/eyebrow-lijn/EyebrowLijn'
import { Parallax } from '@/features/parallax/Parallax'
import scan from '@/content/ai-scan.json'
import '@/components/v3b/beeld.css'
import './ai-v2.css'

export const metadata: Metadata = {
  title: { absolute: ai.titel },
  description: ai.beschrijving,
  alternates: { canonical: '/ai' },
  openGraph: og(ai.titel, ai.beschrijving, '/ai'),
}

/** srcset van een laag van het diepte-beeld (zelfde uitsnede, drie breedtes). */
const DIEPTE = (laag: 'achter' | 'voor') => [768, 1280, 1920].map((w) => `/beeld/diepte-${laag}-${w}.webp ${w}w`).join(', ')

/** parallax: de grote nummers drijven elk in een eigen tempo langs hun regel (alleen decoratie, aria-hidden). */
const DRIFT = ['-36', '28', '-22', '40']

export default function AiPagina() {
  const tedx = over.gesprek.tedx
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([{ naam: 'Home', url: site.domein }, { naam: 'AI', url: `${site.domein}/ai` }])) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema({ naam: tedx.titel, beschrijving: ai.tedx.tekst, youtube: tedx.youtube })) }}
      />
      <Kop pad="/ai" />
      <main id="inhoud" tabIndex={-1} className="outline-none flex-1">
        <section className="ai-kop ai-kop--diepte" aria-labelledby="ai-kop-titel">
          {/* diepte-beeld: het TEDx-podium in drie lagen (podium, kop, publiek) die licht verschuiven */}
          <DiepteBeeld className="ai-diepte" muis={0.012} scroll={0.035} scrollTouch={0.1}>
            <div data-diepte-laag="" data-diepte="0.12">
              <img src="/beeld/diepte-achter-1920.webp" srcSet={DIEPTE('achter')} sizes="100vw" width={1920} height={994} alt={home.fotoAlt} fetchPriority="high" decoding="async" />
            </div>
            <div data-diepte-laag="" data-diepte="0.45" className="db-tekst ai-diepte-tekst">
              <div className="container-site">
                <h1 className="ai-h1" id="ai-kop-titel">{ai.kop}</h1>
              </div>
            </div>
            <div data-diepte-laag="" data-diepte="1">
              <img src="/beeld/diepte-voor-1920.webp" srcSet={DIEPTE('voor')} sizes="100vw" width={1920} height={994} alt="" aria-hidden="true" decoding="async" />
            </div>
          </DiepteBeeld>
          <div className="container-site ai-kop-tekst">
            <EyebrowLijn label={ai.kicker} className="ai-intro" rootMargin="0px 0px -2% 0px">{ai.intro}</EyebrowLijn>
            <p className="ai-tweede">{ai.tweede}</p>
          </div>
        </section>
        <RevealOnScroll once threshold={0.01} rootMargin="0px 0px -6% 0px">
          <section className="sectie container-site" aria-labelledby="wat-kop">
            <div className="sectie-kop" data-reveal="">
              <p className="nr">01</p>
              <h2 id="wat-kop">{ai.wat.kop}</h2>
            </div>
            <Parallax className="ai-lijst-diepte">
            <ol className="ai-lijst">
              {ai.wat.items.map((it, i) => (
                <li key={it.titel} className="ai-item" data-reveal="" data-reveal-delay={String(i * 0.06)}>
                  <span className="ai-nr" aria-hidden="true" data-parallax-y={DRIFT[i % DRIFT.length]}>{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{it.titel}</h3>
                    <p>{it.tekst}</p>
                    {it.link.href === 'checklist' ? (
                      <ChecklistKnop className="link">{it.link.label}</ChecklistKnop>
                    ) : (
                      <a
                        className="link"
                        href={it.link.href}
                        {...(it.link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      >
                        {it.link.label}
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            </Parallax>
          </section>
          <section className="sectie ai-vnv-sectie" aria-labelledby="vnv-kop">
            <div className="container-site sectie-kop" data-reveal="">
              <p className="nr">02</p>
              <h2 id="vnv-kop">{ai.voorNa.kop}</h2>
              <p className="sectie-tekst">{ai.voorNa.tekst}</p>
            </div>
            <VoorNaVerhaal className="ai-vnv" label={ai.voorNa.label} titel={ai.voorNa.titel} scrollLengte={60}>
              {ai.voorNa.stappen.map((s, i) => (
                <figure key={s.beeld} data-vnv-stap="" data-vnv-label={s.label}>
                  <picture>
                    <source media="(max-width: 40rem)" type="image/avif" srcSet={`/beeld/${s.beeld}-390.avif`} />
                    <source media="(max-width: 40rem)" type="image/webp" srcSet={`/beeld/${s.beeld}-390.webp`} />
                    <source type="image/avif" srcSet={`/beeld/${s.beeld}-1440.avif`} />
                    <img src={`/beeld/${s.beeld}-1440.webp`} width={1440} height={900} alt={s.alt} loading={i ? 'lazy' : 'eager'} decoding="async" />
                  </picture>
                  <figcaption>{s.label} — {s.zin}</figcaption>
                </figure>
              ))}
            </VoorNaVerhaal>
          </section>

          <KaartenrijLottie
            className="sectie ai-vragen"
            labelledBy="vragen-kop"
            kop={
              <div className="container-site sectie-kop" data-reveal="">
                <p className="nr">03</p>
                <h2 id="vragen-kop">{ai.vragen.kop}</h2>
                <p className="sectie-tekst">{ai.vragen.tekst}</p>
              </div>
            }
            hoofdLottie="/kaartenrij/hoofd.json"
            hoofdIcoon={`/kaartenrij/${ai.vragen.kaarten[0].icoon}.svg`}
            kaarten={ai.vragen.kaarten.map((k) => ({ titel: k.titel, tekst: k.tekst, lottie: `/kaartenrij/${k.icoon}.json`, icoon: `/kaartenrij/${k.icoon}.svg` }))}
          />

          <section className="sectie container-site ai-scan" aria-labelledby="scan-kop">
            <div className="sectie-kop" data-reveal="">
              <p className="nr">04</p>
              <h2 id="scan-kop">{ai.scan.kopVoor} <PasswordReveal className="ai-scan-woord" word={ai.scan.kopWoord} start={0.85} distance={300} /></h2>
              <p className="sectie-tekst">{ai.scan.tekst}</p>
            </div>
            <ImpactScan config={scan as unknown as ImpactScanConfig} telefoon className="ai-scan-knoppen">
              <a className="knop" href="/contact" data-impact-scan-open="">{ai.scan.opener} <span className="pijl" aria-hidden="true">→</span></a>
              <div className="ai-scan-of"><span>{ai.scan.of}</span> <ChecklistKnop className="link">Website-checklist prompt ↗</ChecklistKnop></div>
            </ImpactScan>
          </section>

          <section className="sectie container-site ai-tedx" aria-labelledby="tedx-kop">
            <div className="sectie-kop" data-reveal="">
              <p className="nr">05</p>
              <h2 id="tedx-kop">{ai.tedx.kop}</h2>
              <p className="sectie-tekst">{ai.tedx.tekst}</p>
            </div>
            <VideoFacade className="ai-video" >
              <div className="vf" data-video-facade="" data-provider="youtube" data-id={tedx.youtube} data-title={tedx.titel} data-reveal="">
                <a className="vf__fallback" data-vf-fallback="" aria-label={tedx.titel} href={`https://www.youtube.com/watch?v=${tedx.youtube}`}>
                  <img src="/beeld/tedx-1280.webp" alt="" width={1280} height={663} loading="lazy" />
                </a>
              </div>
            </VideoFacade>
          </section>
        </RevealOnScroll>
      </main>
      <Voet />
      <Dock />
    </>
  )
}
