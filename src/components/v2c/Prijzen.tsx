import { PrijzenPerDienst } from '@/features/prijzen-per-dienst/PrijzenPerDienst'
import { diensten, euro, prijsTeksten as t } from '@/content/prijzen'
import './prijzen.css'

/** Open prijzen per dienst (prijzen-per-dienst). VOORSTEL: bedragen in src/content/prijzen.ts, nog niet goedgekeurd. */
export function Prijzen() {
  const cta = (dienst: string, pakket: string) => `/contact?dienst=${dienst}&pakket=${pakket}#intake`
  return (
    <PrijzenPerDienst className="prijzen" kanteling={2}>
      {diensten.map((d) => (
        <section key={d.id} className="ppd__paneel" data-ppd-paneel="" data-dienst={d.id} data-titel={d.titel}>
          <h3 className="ppd__paneelkop" data-ppd-paneelkop="">{d.titel}</h3>
          <div className="ppd__kaarten">
            {d.pakketten.map((p) => (
              <article key={p.id} className="ppd__kaart" data-ppd-pakket={p.id} data-populair={p.populair ? '' : undefined}>
                {p.populair ? <p className="ppd__badge">{t.populair}</p> : null}
                <h4 className="ppd__naam">{p.naam}</h4>
                <p className="ppd__prijs">
                  <span className="ppd__vanaf">{t.vanaf}</span> <span className="ppd__bedrag" data-prijs={p.prijs}>{euro(p.prijs)}</span>{' '}
                  <span className="ppd__eenheid">{p.eenheid}</span>
                </p>
                <p className="ppd__tijd">{t.tijd} <strong>{p.tijd}</strong></p>
                <h5 className="ppd__kop">{t.oplevert}</h5>
                <ul className="ppd__lijst ppd__lijst--punt">{p.oplevert.map((x) => <li key={x}>{x}</li>)}</ul>
                <h5 className="ppd__kop">{t.inbegrepen}</h5>
                <ul className="ppd__lijst ppd__lijst--vink">{p.inbegrepen.map((x) => <li key={x}>{x}</li>)}</ul>
                <a className="ppd__cta" data-ppd-cta="" href={cta(d.id, p.id)}>{t.aanvraag(p.naam)}</a>
              </article>
            ))}
          </div>
          <div className="ppd__onder">
            <div className="ppd__faq">
              <h4 className="ppd__faqkop">{t.faq(d.titel)}</h4>
              {d.faq.map((f) => <details key={f.vraag}><summary>{f.vraag}</summary><p>{f.antwoord}</p></details>)}
            </div>
            <p className="ppd__maat">{t.maat} {t.maatTekst} <a data-ppd-cta="" data-pakket="op-maat" href={`/contact?dienst=${d.id}#intake`}>{t.maatLink}</a></p>
          </div>
        </section>
      ))}
    </PrijzenPerDienst>
  )
}
