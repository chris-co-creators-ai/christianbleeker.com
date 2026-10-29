import { StappenMiniUi } from '@/features/stappen-mini-ui/StappenMiniUi'
import { euro } from '@/content/prijzen'
import { werkwijze as t, startPrijs } from '@/content/v3x'
import './v3x.css'

const Vink = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path pathLength={1} d="M3.5 8.5l3 3 6-7" /></svg>
const Doc = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M4.5 2.5h5l2.5 2.5v8.5h-7.5z" /><path d="M9.5 2.5V5H12M6.5 8h3.5M6.5 10.5h3.5" /></svg>
const Venster = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="10" rx="1.5" /><path d="M2 6h12" /></svg>
const Bol = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="5.5" /><path d="M2.5 8h11M8 2.5c1.6 1.6 2.4 3.5 2.4 5.5S9.6 11.9 8 13.5C6.4 11.9 5.6 10 5.6 8S6.4 4.1 8 2.5z" /></svg>

const KEUZES = [
  ['Teksten', 'Over je bedrijf en je diensten'],
  ['Beelden en logo', 'Foto’s en je huisstijl'],
  ['Wensen', 'Wat de site moet doen'],
]
const RECORDS = [['jouwbedrijf.nl', 'ALIAS'], ['www.jouwbedrijf.nl', 'CNAME']]

/** "Zo werken we samen" op /contact: de werkwijze voor een website vanaf € 750, als drie levende stapkaarten (stappen-mini-ui). */
export function Werkwijze() {
  return (
    <section id="werkwijze" className="sectie container-site v3x ww" aria-labelledby="werkwijze-kop">
      <div className="sectie-kop">
        <p className="kicker">{t.kicker}</p>
        <h2 id="werkwijze-kop">{t.kop}</h2>
        <p className="sectie-tekst">{t.tekst}</p>
      </div>
      <span className="demo-label">{t.label}</span>
      <StappenMiniUi
        wolk={false}
        teksten={{ leeg: 'Nog niets', gekozen: '{n} van 3 klaar', voorbeeld: 'Voorbeeld: het bestand uit ChatGPT of Claude met {namen} is klaar.' }}
        meldingGekopieerd="Domeinregels gekopieerd naar het klembord."
        meldingMislukt="Kopiëren lukte niet. Selecteer de regels en kopieer ze zelf."
      >
        <ol className="smu-rij">
          <li className="smu-stap" data-smu-stap="">
            <div className="smu-beeld">
              <div className="smu-illustratie">
                <div className="smu-mini" data-smu-mini="kiezen" aria-hidden="true">
                  <div className="smu-kop">
                    <span className="smu-id"><span className="smu-icoon"><Doc /></span><span className="smu-namen"><strong>Jouw bestand</strong><small>Uit ChatGPT of Claude</small></span></span>
                    <span className="smu-status" data-smu-teller="">3 van 3 klaar</span>
                  </div>
                  <ul className="smu-keuzes">
                    {KEUZES.map(([kop, sub]) => (
                      <li key={kop} className="smu-keuze" data-smu-kies="" data-aan=""><span className="smu-vink"><Vink /></span><span className="smu-namen"><strong>{kop}</strong><small>{sub}</small></span></li>
                    ))}
                  </ul>
                  <div className="smu-totaal">
                    <span>Pakket Start</span>
                    <code className="smu-prijs">{euro(startPrijs)}<small> eenmalig</small></code>
                  </div>
                </div>
                <p className="smu-sr" data-smu-sr="">Voorbeeld: het bestand uit ChatGPT of Claude met teksten, beelden en logo en wensen is klaar.</p>
              </div>
            </div>
            <div className="smu-onderschrift">
              <p className="smu-label">Stap 1 tot 3</p>
              <h3>Jij vertelt, de AI verzamelt</h3>
              <p>Je plakt onze prompt in ChatGPT of Claude. Die stelt de vragen en maakt er één bestand van, dat je naar ons stuurt.</p>
            </div>
          </li>

          <li className="smu-stap" data-smu-stap="">
            <div className="smu-beeld">
              <div className="smu-illustratie">
                <div className="smu-mini" data-smu-mini="opzetten" aria-hidden="true">
                  <div className="smu-kop">
                    <span className="smu-id"><span className="smu-icoon"><Venster /></span><span className="smu-namen"><strong>Jouw website</strong><small>jouwbedrijf.nl</small></span></span>
                    <span className="smu-status" data-smu-server="" data-staat="klaar">
                      <i className="smu-stip" />
                      <span className="smu-wissel"><span data-smu-als="bezig">Wordt gebouwd</span><span data-smu-als="klaar">Voorbeeldlink klaar</span></span>
                    </span>
                  </div>
                  <ol className="smu-log">
                    <li className="smu-regel" data-smu-regel=""><span className="smu-id"><span className="smu-regel__icoon"><Doc /></span><span className="smu-namen"><strong>Bestand gelezen</strong><small>Teksten, beelden en wensen</small></span></span><code>dag 1</code></li>
                    <li className="smu-regel" data-smu-regel="" data-smu-installeer=""><span className="smu-id"><span className="smu-regel__icoon"><Venster /></span><span className="smu-namen"><strong>Pagina’s gebouwd</strong><small>Snel op elke telefoon</small></span></span><span className="smu-regel__eind"><span className="smu-balk"><i /></span><code>dag 6</code></span></li>
                    <li className="smu-regel" data-smu-regel=""><span className="smu-id"><span className="smu-regel__icoon"><Bol /></span><span className="smu-namen"><strong>Getest</strong><small>Telefoon, tablet en computer</small></span></span><code>dag 8</code></li>
                  </ol>
                  <div className="smu-voet" data-smu-voet="">
                    <span><i className="smu-check"><svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg><i className="smu-ring" /></i>Voorbeeldlink verstuurd</span>
                    <code>feedback welkom</code>
                  </div>
                </div>
                <p className="smu-sr">Voorbeeld: de site is gebouwd en getest, en de voorbeeldlink is verstuurd.</p>
              </div>
            </div>
            <div className="smu-onderschrift">
              <p className="smu-label">Stap 4 en 5</p>
              <h3>Wij bouwen, jij kijkt mee</h3>
              <p>Je krijgt een voorbeeldlink en loopt zelf door de site. Wat anders moet, passen we aan tot je tevreden bent.</p>
            </div>
          </li>

          <li className="smu-stap" data-smu-stap="">
            <div className="smu-beeld">
              <div className="smu-illustratie">
                <div className="smu-mini" data-smu-mini="koppelen">
                  <div className="smu-kop">
                    <span className="smu-id">
                      <span className="smu-icoon" aria-hidden="true"><Bol /></span>
                      <span className="smu-namen"><strong id="ww-dns-titel">Domeinregels (voorbeeld)</strong><small>jouwbedrijf.nl</small></span>
                    </span>
                    <button type="button" className="smu-kopieer" data-smu-kopieer="" aria-describedby="ww-dns-titel" hidden>
                      <span className="smu-wissel">
                        <span data-smu-als="klaar"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.75" /><path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" /></svg>Kopieer</span>
                        <span data-smu-als="gekopieerd"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>Gekopieerd</span>
                        <span data-smu-als="mislukt">Lukt niet</span>
                      </span>
                    </button>
                  </div>
                  <div className="smu-records">
                    <table className="smu-tabel" aria-labelledby="ww-dns-titel">
                      <thead><tr><th scope="col">Naam</th><th scope="col">Type</th><th scope="col">SSL</th></tr></thead>
                      <tbody>
                        {RECORDS.map(([naam, type]) => (
                          <tr key={naam} data-smu-record=""><td><code>{naam}</code></td><td>{type}</td><td><span className="smu-ssl" data-smu-ssl="" data-staat="actief"><span className="smu-wissel"><span data-smu-als="bezig">Bezig</span><span data-smu-als="actief">Actief</span></span></span></td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="smu-doel">
                    <div><span>Wijst naar</span><strong><code data-smu-doel="">cname.vercel-dns.com</code></strong></div>
                    <div><span>Certificaat</span><strong>Automatisch</strong></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="smu-onderschrift">
              <p className="smu-label">Stap 6</p>
              <h3>Live, en daarna van jou</h3>
              <p>Wij zetten de site live en dragen alles over, ook de server en de opslag. Met ons stappenplan kan dat binnen 20 minuten.</p>
            </div>
          </li>
        </ol>
      </StappenMiniUi>
      <ol className="ww-stappen">
        {t.stappen.map((s) => <li key={s.kop}><span><strong>{s.kop}</strong> {s.tekst}</span></li>)}
      </ol>
    </section>
  )
}
