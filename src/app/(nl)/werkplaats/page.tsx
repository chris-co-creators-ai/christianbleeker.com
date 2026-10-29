import type { Metadata } from 'next'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { og } from '@/lib/og-velden'
import { Kop } from '@/components/secties/Kop'
import { Voet } from '@/components/secties/Voet'
import { site } from '@/content/site'
import { breadcrumbSchema } from '@/lib/schema'
import { werkplaats as w, rechtenConfig, openSchema } from '@/content/werkplaats'
import { demoUrl } from '@/content/demos'
import { Proefstuk } from '@/components/werkplaats/Proefstuk'
import { Intake } from '@/components/werkplaats/Intake'
import { ThreeMascot } from '@/features/three-mascot/ThreeMascot'
import { WerkgebiedKaart } from '@/features/werkgebied-kaart/WerkgebiedKaart'
import { AfstandPostcode } from '@/features/afstand-postcode/AfstandPostcode'
import { OpenStatus } from '@/features/open-status/OpenStatus'
import { KleurConfigurator } from '@/features/kleur-configurator/KleurConfigurator'
import { Besteldeadline } from '@/features/besteldeadline/Besteldeadline'
import { Drempelteller } from '@/features/drempelteller/Drempelteller'
import { Boekingsvelden } from '@/features/boekingsvelden/Boekingsvelden'
import { ZoekKeuzelijst } from '@/features/zoek-keuzelijst/ZoekKeuzelijst'
import { KennisbankFilter } from '@/features/kennisbank-filter/KennisbankFilter'
import { Rechtenmatrix } from '@/features/rechtenmatrix/Rechtenmatrix'
import beroepen from '@/features/zoek-keuzelijst/beroepen.json'
import { InterneApps } from '@/components/v3x/InterneApps'
import { interneApps } from '@/content/v3x'
import '@/components/werkplaats/werkplaats.css'

export const metadata: Metadata = {
  title: { absolute: w.titel },
  description: w.beschrijving,
  alternates: { canonical: '/werkplaats' },
  openGraph: og(w.titel, w.beschrijving, '/werkplaats'),
}

/** De kaart van het werkgebied: SVG uit maak-kaart.mjs van de bibliotheek, bij het bouwen ingelezen. */
const kaartSvg = readFileSync(path.join(process.cwd(), 'src/content/werkplaats/kaart.svg'), 'utf8')
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const datum = (iso: string) => new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso))
const [g1, g2, g3, g4] = w.groepen

function Groep({ groep, nr, children }: { groep: (typeof w.groepen)[number]; nr: number; children: React.ReactNode }) {
  return (
    <section id={groep.id} className="sectie container-site wp-groep" aria-labelledby={`${groep.id}-kop`}>
      <div className="sectie-kop wp-groep-kop">
        <p className="kicker">{`0${nr}`} <span aria-hidden="true">—</span> {groep.naam}</p>
        <h2 id={`${groep.id}-kop`}>{groep.kop}</h2>
        <p className="sectie-tekst">{groep.tekst}</p>
        {groep.apps ? <p className="sectie-tekst">{groep.apps.tekst} <a className="link" href={groep.apps.href}>{groep.apps.link}</a></p> : null}
      </div>
      {children}
    </section>
  )
}

export default function Werkplaats() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([{ naam: 'Home', url: site.domein }, { naam: w.menu, url: `${site.domein}/werkplaats` }])) }}
      />
      <Kop pad="/werkplaats" />
      <main id="inhoud" tabIndex={-1} className="outline-none flex-1 werkplaats">
        <section className="container-site wp-hero" aria-labelledby="wp-h1">
          <div className="wp-hero-tekst">
            <p className="kicker">{w.kicker}</p>
            <h1 id="wp-h1" className="wp-h1">{w.kop}<span className="x" aria-hidden="true">×</span></h1>
            <p className="wp-intro">{w.intro}</p>
            <p className="wp-eerlijk">{w.eerlijk}</p>
            <nav className="wp-inhoud" aria-label={w.inhoud}>
              <ol>
                {w.groepen.map((g, i) => (
                  <li key={g.id}><a href={`#${g.id}`}><span className="wp-inhoud-nr" aria-hidden="true">{`0${i + 1}`}</span>{g.naam}</a></li>
                ))}
                <li><a href={`#${interneApps.id}`}><span className="wp-inhoud-nr" aria-hidden="true">{interneApps.nr}</span>{interneApps.naam}</a></li>
              </ol>
            </nav>
          </div>
          <figure className="wp-hond" id={w.hond.id} aria-labelledby={`${w.hond.id}-kop`}>
            <ThreeMascot className="wp-hond-podium" vorm="hond" kijk="links" posterSrc="/werkplaats/bobbie-poster.webp" posterAlt={w.hond.alt} posterOnMobile />
            <figcaption className="wp-hond-tekst">
              <span className="demo-label">{w.label}</span>
              <span id={`${w.hond.id}-kop`} className="proefstuk-kop">{w.hond.voor}</span>
              <span className="proefstuk-zin">{w.hond.zin}</span>
              <a className="proefstuk-demo" href={demoUrl(w.hond.demo)} target="_blank" rel="noopener noreferrer" aria-label={w.demoAria(w.hond.demo)}>
                {w.demo(w.hond.demo)} <span aria-hidden="true">↗</span>
              </a>
            </figcaption>
          </figure>
        </section>

        <Groep groep={g1} nr={1}>
          <Proefstuk stuk={w.kaart.stuk} breed kaal>
            <WerkgebiedKaart className="wp-kaart">
              <div className="wk-podium" data-wk-podium>
                <div className="wk-kaartvak" dangerouslySetInnerHTML={{ __html: kaartSvg }} />
              </div>
              <ol className="wk-lijst">
                {w.kaart.projecten.map((p) => (
                  <li key={p.id} className="wk-project" id={`wk-${p.id}`} data-wk-project={p.id}>
                    <article className="wk-kaartje">
                      <img className="wk-foto" src={`/werkplaats/${p.foto}.webp`} width={800} height={600} loading="lazy" decoding="async" alt={p.alt} />
                      <div className="wk-tekst">
                        <p className="wk-plaats">{p.plaats}</p>
                        <p className="wk-zin">{p.zin}</p>
                      </div>
                    </article>
                  </li>
                ))}
              </ol>
            </WerkgebiedKaart>
          </Proefstuk>

          <Proefstuk stuk={w.afstand.stuk}>
            <AfstandPostcode className="wp-afstand">
              <form data-afstand-form className="wp-afstand-zoek">
                <label htmlFor="wp-postcode">{w.afstand.postcode}</label>
                <div className="wp-afstand-rij">
                  <input id="wp-postcode" data-afstand-postcode-input placeholder="8011 AB" autoComplete="postal-code" inputMode="text" />
                  <button type="submit" className="knop">{w.afstand.zoek}</button>
                </div>
              </form>
              <label className="wp-afstand-straal" htmlFor="wp-straal">{w.afstand.straal}
                <select id="wp-straal" data-afstand-straal defaultValue="0">
                  <option value="0">{w.afstand.alles}</option>
                  <option value="10">10 km</option>
                  <option value="25">25 km</option>
                </select>
              </label>
              <p data-afstand-status role="status" aria-live="polite" className="wp-afstand-status" />
              <ul data-afstand-lijst className="wp-afstand-lijst">
                {w.afstand.praktijken.map((p) => (
                  <li key={p.naam} data-locatie data-lat={p.lat} data-lng={p.lng}>
                    <span className="wp-afstand-naam">{p.naam}</span>
                    <span data-afstand-km className="wp-afstand-km" />
                  </li>
                ))}
              </ul>
            </AfstandPostcode>
          </Proefstuk>

          <Proefstuk stuk={w.open.stuk}>
            <div className="wp-open">
              <OpenStatus className="wp-open-status" schema={openSchema} standaardTekst={w.open.laden} />
              <table className="wp-open-tabel">
                <caption>{w.open.tabelKop}</caption>
                <tbody>
                  {w.open.dagen.map((d) => (
                    <tr key={d.dag}><th scope="row">{d.dag}</th><td>{d.tijd}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Proefstuk>
        </Groep>

        <Groep groep={g2} nr={2}>
          <Proefstuk stuk={w.kleur.stuk}>
            <KleurConfigurator className="wp-kleur">
              <div data-kleur-foto>
                <img data-kleur-img src="/werkplaats/deur-wit.svg" width={800} height={600} alt={w.kleur.alt} />
              </div>
              <div className="wp-kleur-onder">
                <fieldset data-kleur-swatches>
                  <legend>{w.kleur.legend}</legend>
                  <div data-kleur-groep>
                    {w.kleur.kleuren.map((k, i) => (
                      <label key={k.id} className="kc-swatch">
                        <input type="radio" name="deur-kleur" value={k.id} data-kleur-src={`/werkplaats/deur-${k.id}.svg`} data-kleur-label={k.naam} data-kleur-prijs={k.prijs} defaultChecked={i === 0} />
                        <span className="kc-swatch-dot" style={{ ['--kc-swatch' as string]: k.hex }} aria-hidden="true" />
                        <span className="kc-swatch-label">{k.naam}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="kc-info" aria-live="polite">
                  <p data-kleur-naam />
                  <p data-kleur-meerprijs />
                </div>
              </div>
            </KleurConfigurator>
          </Proefstuk>

          <Proefstuk stuk={w.deadline.stuk}>
            <Besteldeadline deadline="12:00" geslotenWeekdagen="0,1" geslotenDatums="2026-12-25,2026-12-26,2027-01-01" className="wp-deadline">
              <label htmlFor="wp-ophaaldag">{w.deadline.label}</label>
              <input id="wp-ophaaldag" type="date" name="ophaaldag" data-besteldeadline-input />
              <p className="wp-deadline-hint">{w.deadline.hint}</p>
              <p data-besteldeadline-melding className="wp-deadline-melding" />
            </Besteldeadline>
          </Proefstuk>

          <Proefstuk stuk={w.drempel.stuk}>
            <Drempelteller className="wp-drempel" waarde={w.drempel.waarde} doel={w.drempel.doel} tekst={w.drempel.tekst} tekstBereikt={w.drempel.tekstBereikt} label={w.drempel.label} optellen>
              <p>{w.drempel.zonderJs}</p>
            </Drempelteller>
          </Proefstuk>
        </Groep>

        <Groep groep={g3} nr={3}>
          <Proefstuk stuk={w.boeking.stuk}>
            <Boekingsvelden className="wp-boeking" url={w.boeking.url} modus="tafel" dienst="generiek" doel="dialoog" iframe fallbackTekst={w.boeking.fallback} />
          </Proefstuk>

          <Proefstuk stuk={w.funnel.stuk}>
            <Intake />
          </Proefstuk>

          <Proefstuk stuk={w.keuzelijst.stuk}>
            <ZoekKeuzelijst className="wp-keuzelijst" placeholder={w.keuzelijst.leeg} andersLabel={w.keuzelijst.andersLabel}>
              <label htmlFor="wp-beroep">{w.keuzelijst.label}</label>
              <select id="wp-beroep" name="beroep" defaultValue="">
                <option value="">{w.keuzelijst.leeg}</option>
                {beroepen.groepen.map((g) => (
                  <optgroup key={g.naam} label={g.naam}>
                    {g.beroepen.map((b) => <option key={b.naam} value={slug(b.naam)} data-synoniemen={b.synoniemen.join(', ')}>{b.naam}</option>)}
                  </optgroup>
                ))}
                <option value="anders" data-anders="">{w.keuzelijst.anders}</option>
              </select>
            </ZoekKeuzelijst>
          </Proefstuk>
        </Groep>

        <Groep groep={g4} nr={4}>
          <Proefstuk stuk={w.kennisbank.stuk} breed>
            <KennisbankFilter className="wp-kennis" perPagina={6}>
              {w.kennisbank.items.map((k) => (
                <li key={k.titel} className="kb-kaart" data-kb-kaart data-kb-categorie={k.categorie} data-kb-soort={k.soort} data-kb-datum={k.datum}>
                  <div className="kb-link">
                    <div className="kb-body">
                      <p className="kb-meta">{w.kennisbank.soorten[k.soort]} · {k.categorie.split('|').join(' · ')} · <time dateTime={k.datum}>{datum(k.datum)}</time></p>
                      <h4 className="kb-titel" data-kb-titel>{k.titel}</h4>
                      <p className="kb-samenvatting" data-kb-samenvatting>{k.samenvatting}</p>
                    </div>
                  </div>
                </li>
              ))}
            </KennisbankFilter>
          </Proefstuk>

          <Proefstuk stuk={w.rechten.stuk} breed>
            <Rechtenmatrix className="wp-rechten" config={rechtenConfig} />
          </Proefstuk>
        </Groep>

        <InterneApps />
      </main>
      <Voet uitnodiging />
    </>
  )
}
