import type { Metadata } from 'next'
import { Kop } from '@/components/secties/Kop'
import { Voet } from '@/components/secties/Voet'
import { Beeld, OMSLAG } from '@/components/Beeld'
import { Dock } from '@/components/Dock'
import { EigenProduct } from '@/components/secties/EigenProduct'
import { werk, casePagina } from '@/content/teksten'
import { cases } from '@/content/cases'
import { site } from '@/content/site'
import { breadcrumbSchema } from '@/lib/schema'
import { BentoGrid } from '@/features/bento-grid/BentoGrid'
import { CustomCursor } from '@/features/custom-cursor/CustomCursor'
import { RevealOnScroll } from '@/features/reveal-on-scroll/RevealOnScroll'

export const metadata: Metadata = {
  title: { absolute: werk.titel },
  description: werk.beschrijving,
  alternates: { canonical: '/work' },
  openGraph: { title: werk.titel, description: werk.beschrijving, url: '/work' },
}

/** Tegelmaten in het bento-raster: ritme groot · klein · klein · breed … (bento-grid). */
const MAAT = ['groot', 'hoog', 'hoog', 'hoog', 'hoog', 'groot', 'groot', 'hoog', 'hoog'] as const

export default function Werk() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([{ naam: 'Home', url: site.domein }, { naam: 'Werk', url: `${site.domein}/work` }])) }}
      />
      <Kop pad="/work" />
      <main id="inhoud" tabIndex={-1} className="outline-none flex-1">
        <section className="werk-intro container-site">
          <h1 className="werk-h1">{werk.kop}</h1>
        </section>
        <RevealOnScroll once>
          <EigenProduct />
          <section id="werk" className="sectie container-site" aria-labelledby="websites-kop">
            <div className="sectie-kop" data-reveal="">
              <h2 id="websites-kop">{werk.websites}</h2>
            </div>
              <BentoGrid className="werk-bento" >
                {cases.map((c, i) => (
                  <article key={c.slug} data-tegel={MAAT[i]} className="tegel" data-reveal="">
                    <div className="tegel__media">
                      <Beeld naam={`${c.slug}-omslag`} {...OMSLAG} sizes="(min-width: 1024px) 45vw, 92vw" alt="" />
                    </div>
                    <div className="tegel__tekst">
                      <h3 className="tegel__titel">{c.naam}</h3>
                      <p><span className="sr-only">{werk.kort}: </span>{c.kort}</p>
                    </div>
                    <a className="tegel__link" href={`/work/${c.slug}`} data-cursor-label={werk.cursor}>
                      <span className="sr-only">{casePagina.omslagAlt(c.naam)}</span>
                    </a>
                  </article>
                ))}
              </BentoGrid>
          </section>
        </RevealOnScroll>
      </main>
      <Voet />
      <Dock />
      <CustomCursor variant="crosshair" interactiveSelector=".tegel__link" magnetic={false} />
    </>
  )
}
