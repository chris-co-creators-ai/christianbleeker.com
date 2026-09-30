import type { Metadata } from 'next'
import { og } from '@/lib/og-velden'
import { notFound } from 'next/navigation'
import { Kop } from '@/components/secties/Kop'
import { Voet } from '@/components/secties/Voet'
import { Beeld, OMSLAG, SCHERM } from '@/components/Beeld'
import { Dock } from '@/components/Dock'
import { casePagina } from '@/content/teksten'
import { cases, caseVoor } from '@/content/cases'
import { site } from '@/content/site'
import { breadcrumbSchema, caseSchema } from '@/lib/schema'
import { Reislijn } from '@/features/reislijn/ReislijnLijn'
import { MarkerHighlight } from '@/features/marker-highlight/MarkerHighlight'

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
    openGraph: og(titel, beschrijving, `/work/${c.slug}`, { images: [{ url: `/beeld/${c.slug}-deel.jpg`, width: 1200, height: 840 }] }),
  }
}

export default async function CasePagina({ params }: { params: Promise<{ slug: string }> }) {
  const c = caseVoor((await params).slug)
  if (!c) notFound()
  const i = cases.indexOf(c)
  const volgende = cases[(i + 1) % cases.length]
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
              <div className="case-scherm beeld">
                <Beeld naam={`${c.slug}-scherm`} {...SCHERM} sizes="(min-width: 900px) 60vw, 92vw" alt={casePagina.schermAlt(c.naam)} />
              </div>
              {c.url ? (
                <a className="knop" href={c.url} target="_blank" rel="noopener noreferrer">{casePagina.bekijk}</a>
              ) : null}
            </section>
          </div>
        </Reislijn>
        <nav className="case-volgende container-site" aria-label={casePagina.volgende}>
          <a href={`/work/${volgende.slug}`} className="volgende-link">
            <span className="kicker">{casePagina.volgende}</span>
            <span className="volgende-naam">{volgende.naam} <span className="x" aria-hidden="true">×</span></span>
          </a>
        </nav>
      </main>
      <Voet />
      <Dock />
    </>
  )
}
