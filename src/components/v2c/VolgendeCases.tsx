import { KaartenstapelZij } from '@/features/kaartenstapel-zij/KaartenstapelZij'
import { Beeld, OMSLAG } from '@/components/Beeld'
import { casePagina } from '@/content/teksten'
import { cases, type Case } from '@/content/cases'
import './volgende-cases.css'

/**
 * Onder een case: de volgende vier cases als stapel die zijwaarts over elkaar schuift (kaartenstapel-zij),
 * en als laatste kaart de weg terug naar alle projecten. Vervangt de ene link "Volgende case": je ziet
 * waar je heen gaat voordat je klikt.
 */
export function VolgendeCases({ huidig }: { huidig: Case }) {
  const t = casePagina.stapel
  const i = cases.indexOf(huidig)
  const volgende = [1, 2, 3, 4].map((n) => cases[(i + n) % cases.length])
  return (
    <KaartenstapelZij
      className="volgende-stapel"
      kaartClassName="volgende-kaart"
      labelledBy="volgende-kop"
      label={t.kop}
      kop={
        <div className="container-site volgende-stapel__kop">
          <p className="kicker">{casePagina.volgende}</p>
          <h2 id="volgende-kop">{t.kop}</h2>
        </div>
      }
      kaarten={[
        ...volgende.map((c) => (
          <article key={c.slug} className="volgende-kaart__binnen">
            <div className="volgende-kaart__beeld beeld">
              <Beeld naam={`${c.slug}-omslag`} {...OMSLAG} sizes="(min-width: 768px) 22vw, 70vw" alt="" />
            </div>
            <h3 className="volgende-kaart__naam">{c.naam}</h3>
            <p className="volgende-kaart__kort">{c.kort}</p>
            <div className="volgende-kaart__knop">
              <a data-kz-knop="" className="knop" href={`/work/${c.slug}`} aria-label={`${t.bekijk}: ${c.naam}`}>
                {t.bekijk} <span className="pijl" aria-hidden="true">→</span>
              </a>
            </div>
          </article>
        )),
        <article key="alle" className="volgende-kaart__binnen volgende-kaart__binnen--alle">
          <span className="x volgende-kaart__x" aria-hidden="true">×</span>
          <h3 className="volgende-kaart__naam">{t.alle}</h3>
          <p className="volgende-kaart__kort">{t.alleTekst}</p>
          <div className="volgende-kaart__knop">
            <a data-kz-knop="" className="knop knop--mint" href="/work">{t.alle} <span className="pijl" aria-hidden="true">→</span></a>
          </div>
        </article>,
      ]}
    />
  )
}
