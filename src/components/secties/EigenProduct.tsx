import { Beeld } from '@/components/Beeld'
import { eigenProduct, dicterenUrl, cocreatorsWachtlijst, werk } from '@/content/teksten'
import { caseVoor } from '@/content/cases'
import { HandwrittenAccent } from '@/features/handwritten-accent/HandwrittenAccent'

/**
 * Eigen product: Dicteren.ai en Co-creatie.ai op één raster, met de drie teamfoto's op één lijn
 * (PRD P-4: 0 px verschil in bovenkant), en daaronder over de volle breedte Co-Creators.ai met de
 * link naar de wachtlijst. Staat op Home en bovenaan /work.
 */
export function EigenProduct({ nummer, kopNiveau = 2, prioriteit = false }: { nummer?: string; kopNiveau?: 2 | 3; prioriteit?: boolean }) {
  const Kop = `h${kopNiveau}` as 'h2'
  const co = caseVoor('co-creatie-ai')!
  return (
    <section id="producten" className="sectie container-site eigen">
      <div className="sectie-kop" data-reveal="">
        {nummer ? <p className="nr">{nummer}</p> : null}
        <Kop>{eigenProduct.kop}</Kop>
      </div>
      <div className="eigen-raster">
        <article className="eigen-kaart eigen-dicteren" data-reveal="">
          <div className="eigen-logo">
            <Beeld naam="dicteren" breedte={800} hoogte={320} alt={eigenProduct.dicteren.beeldAlt} prioriteit={prioriteit} />
          </div>
          <h3>{eigenProduct.dicteren.naam}</h3>
          <p>{eigenProduct.dicteren.tekst}</p>
          <HandwrittenAccent label={eigenProduct.label} arrow tilt={-5} className="eigen-hand">
            <ul className="team" aria-label={eigenProduct.label}>
              {eigenProduct.team.map((t) => (
                <li key={t.naam} className="team-lid">
                  <span className="beeld team-foto">
                    <Beeld naam={t.beeld} breedte={526} hoogte={736} alt="" />
                  </span>
                  <span className="team-naam">{t.naam}</span>
                </li>
              ))}
            </ul>
          </HandwrittenAccent>
          <a className="knop knop--mint" href={dicterenUrl} target="_blank" rel="noopener noreferrer">
            {eigenProduct.dicteren.link}
          </a>
        </article>
        <article className="eigen-kaart eigen-co" data-reveal="" data-reveal-delay="0.06">
          <div className="eigen-logo eigen-logo--co">
            <Beeld naam="co-creatie" breedte={600} hoogte={600} alt={eigenProduct.cocreatie.beeldAlt} />
          </div>
          <h3>{eigenProduct.cocreatie.naam}</h3>
          <p className="kicker">{werk.kort}</p>
          <p>{co.kort}</p>
          <p>{eigenProduct.cocreatie.tekst}</p>
          <a className="knop knop--rand" href={`/work/${co.slug}`}>
            {eigenProduct.cocreatie.naam} <span className="pijl" aria-hidden="true">→</span>
          </a>
        </article>
        <article className="eigen-kaart eigen-creators" data-reveal="" data-reveal-delay="0.12">
          <div className="eigen-creators-tekst">
            <p className="kicker">{eigenProduct.cocreators.kicker}</p>
            <h3>{eigenProduct.cocreators.naam}</h3>
            <p>{eigenProduct.cocreators.tekst}</p>
            {eigenProduct.cocreators.verhaal.map((z) => <p key={z.slice(0, 16)}>{z}</p>)}
            <p>{eigenProduct.cocreators.wachtlijst}</p>
            <a className="knop knop--mint" href={cocreatorsWachtlijst} target="_blank" rel="noopener noreferrer">
              {eigenProduct.cocreators.link}
            </a>
          </div>
          <div className="eigen-creators-beeld beeld">
            <Beeld naam="co-creators" maten={[640, 1200]} breedte={1499} hoogte={1049} sizes="(min-width: 900px) 46vw, 92vw" alt={eigenProduct.cocreators.beeldAlt} />
          </div>
        </article>
      </div>
    </section>
  )
}
