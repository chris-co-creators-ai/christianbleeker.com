import type { Metadata } from 'next'
import { og } from '@/lib/og-velden'
import { notFound } from 'next/navigation'
import { Kop } from '@/components/secties/Kop'
import { Voet } from '@/components/secties/Voet'
import { Beeld, OMSLAG, SCHERM } from '@/components/Beeld'
import { ExterneLink } from '@/components/ExterneLink'
import { Dock } from '@/components/Dock'
import { casePagina } from '@/content/teksten'
import { cases, caseVoor, domein } from '@/content/cases'
import { site } from '@/content/site'
import { breadcrumbSchema, caseSchema } from '@/lib/schema'
import { Reislijn } from '@/features/reislijn/ReislijnLijn'
import { MarkerHighlight } from '@/features/marker-highlight/MarkerHighlight'
import { CaseKader } from '@/components/v2c/CaseKader'
import { VolgendeCases } from '@/components/v2c/VolgendeCases'
import { inKader } from '@/content/kader'

export const dynamicParams = false
export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = caseVoor((await params).slug)
  if (!c) return {}
  const titel = casePagina.titel(c.naam)
  const beschrijving = casePagina.beschrijving(c.naam, c.kort)
  return {
    title: { absolute: titel },
    description: beschrijving,
    alternates: { canonical: `/work/${c.slug}` },
    // JPG: LinkedIn toont geen WebP als deelplaatje.
    openGraph: og(titel, beschrijving, `/work/${c.slug}`, { images: [{ url: `/beeld/${c.slug}-deel.jpg`, width: 1200, height: 630 }] }),
  }
}

export default async function CasePagina({ params }: { params: Promise<{ slug: string }> }) {
  const c = caseVoor((await params).slug)
  if (!c) notFound()
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(caseSchema(site, c)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([
          { naam: 'Home', url: site.domein }, { naam: 'Werk', url: `${site.domein}/work` }, { naam: c.naam, url: `${site.domein}/work/${c.slug}` },
        ])) }}
      />
      <Kop pad="/work" />
      <main id="inhoud" tabIndex={-1} className="outline-none flex-1">
        <section className="case-kop container-site">
          <a className="case-terug" href="/work"><span aria-hidden="true">← </span>{casePagina.terug}</a>
          <h1 className={c.naam.length > 14 ? 'case-h1 case-h1--lang' : 'case-h1'}>{c.naam}</h1>
          <div className="case-omslag beeld">
            <Beeld naam={`${c.slug}-omslag`} {...OMSLAG} sizes="(min-width: 900px) 36vw, 92vw" alt={casePagina.omslagAlt(c.naam)} prioriteit />
          </div>
        </section>
        <Reislijn className="case-lijn container-site" kolom=".case-kolom" mobiel="dun">
          <div className="case-kolom">
            <section data-reislijn-halte="" className="case-halte">
              <p className="kicker">{casePagina.kort}</p>
              <p className="case-kort">{c.kort}</p>
            </section>
            <section data-reislijn-halte="" className="case-halte">
              {c.alineas.map((a) => <p key={a.slice(0, 20)} className="case-alinea">{a}</p>)}
            </section>
            <section data-reislijn-halte="" className="case-halte">
              <MarkerHighlight kleur="#f0533a66" hoogte="half">
                <h2 className="case-h2"><mark data-marker="">{casePagina.ontwerpdoel}</mark></h2>
              </MarkerHighlight>
              <p className="case-alinea">{c.ontwerpdoel}</p>
            </section>
            <section data-reislijn-halte="" className="case-halte">
              {c.url ? (
                <CaseKader slug={c.slug} naam={c.naam} url={c.url} live={inKader[c.slug]} />
              ) : (
                <div className="case-scherm beeld">
                  <Beeld naam={`${c.slug}-scherm`} {...SCHERM} sizes="(min-width: 900px) 60vw, 92vw" alt={casePagina.schermAlt(c.naam)} />
                </div>
              )}
              {c.url ? (
                <p className="case-extern">
                  <ExterneLink c={c} className="knop" />
                  <span className="case-domein">{domein(c.url)}</span>
                </p>
              ) : null}
            </section>
          </div>
        </Reislijn>
        <VolgendeCases huidig={c} />
      </main>
      <Voet />
      <Dock />
    </>
  )
}
