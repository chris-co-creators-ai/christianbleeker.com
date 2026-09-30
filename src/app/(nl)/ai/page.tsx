import type { Metadata } from 'next'
import { Kop } from '@/components/secties/Kop'
import { Voet } from '@/components/secties/Voet'
import { Beeld } from '@/components/Beeld'
import { ChecklistKnop } from '@/components/ChecklistKnop'
import { Dock } from '@/components/Dock'
import { ai, over } from '@/content/teksten'
import { site } from '@/content/site'
import { breadcrumbSchema, videoSchema } from '@/lib/schema'
import { VideoFacade } from '@/features/video-facade/VideoFacade'
import { RevealOnScroll } from '@/features/reveal-on-scroll/RevealOnScroll'

export const metadata: Metadata = {
  title: { absolute: ai.titel },
  description: ai.beschrijving,
  alternates: { canonical: '/ai' },
  openGraph: { title: ai.titel, description: ai.beschrijving, url: '/ai' },
}

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
        <section className="ai-kop">
          <div className="ai-foto" aria-hidden="true">
            <Beeld naam="tedx" maten={[768, 1280, 1920]} breedte={3216} hoogte={1666} alt="" prioriteit />
          </div>
          <div className="container-site ai-kop-tekst">
            <p className="kicker">{ai.kicker} <span className="x" aria-hidden="true">×</span></p>
            <h1 className="ai-h1">{ai.kop}</h1>
            <p className="ai-intro">{ai.intro}</p>
            <p className="ai-tweede">{ai.tweede}</p>
          </div>
        </section>
        <RevealOnScroll once threshold={0.01} rootMargin="0px 0px -6% 0px">
          <section className="sectie container-site" aria-labelledby="wat-kop">
            <div className="sectie-kop" data-reveal="">
              <p className="nr">01</p>
              <h2 id="wat-kop">{ai.wat.kop}</h2>
            </div>
            <ol className="ai-lijst">
              {ai.wat.items.map((it, i) => (
                <li key={it.titel} className="ai-item" data-reveal="" data-reveal-delay={String(i * 0.06)}>
                  <span className="ai-nr" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
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
          </section>
          <section className="sectie container-site ai-tedx" aria-labelledby="tedx-kop">
            <div className="sectie-kop" data-reveal="">
              <p className="nr">02</p>
              <h2 id="tedx-kop">{ai.tedx.kop}</h2>
              <p className="sectie-tekst">{ai.tedx.tekst}</p>
            </div>
            <VideoFacade className="ai-video" >
              <div className="vf" data-video-facade="" data-provider="youtube" data-id={tedx.youtube} data-title={tedx.titel} data-reveal="">
                <a className="vf__fallback" data-vf-fallback="" href={`https://www.youtube.com/watch?v=${tedx.youtube}`}>
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
