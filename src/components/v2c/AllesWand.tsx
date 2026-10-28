import { EindeloosRaster } from '@/features/eindeloos-raster/EindeloosRaster'
import { werk } from '@/content/teksten'
import { cases, domein } from '@/content/cases'
import { demos, demoUrl } from '@/content/demos'
import './alles-wand.css'

/**
 * Onder de showcase: klanten en ontwerp-demo's door elkaar in één beeldwand die terugkomt bij het scrollen
 * (eindeloos-raster), met "Alles als lijst" als uitweg en onderaan alles op een rij. De showcase erboven
 * ordent (bento, carrousel); deze wand is om te bladeren, de lijst om snel iets terug te vinden.
 *
 * Kolomritme voor een naadloze herhaling: per kolom evenveel grote (case, 2:3) als kleine (demo, 1:1)
 * tegels. 24 tegels = 12 cases en 12 demo's; 4 kolommen × 6 en 2 kolommen × 12 (README eindeloos-raster).
 */
const PATROON = 'GKGKGKKGKGKGGKGKGKKGKGKG'

export function AllesWand() {
  const t = werk.alles
  let g = 0
  let k = 0
  const tegels = [...PATROON].map((p) => (p === 'G' ? { soort: 'case' as const, c: cases[g++] } : { soort: 'demo' as const, d: demos[k++] }))
  return (
    <>
    <EindeloosRaster className="alles-wand" labelledBy="alles-kop" cycli={2}>
      <div className="container-site alles-wand__kop">
        <p className="kicker">{t.kicker}</p>
        <h2 id="alles-kop">{t.kop}</h2>
        <p className="sectie-tekst">{t.tekst}</p>
      </div>
      <div className="er__balk" data-er-balk="">
        <a className="er__uitweg" href="#alles-lijst">
          {t.uitweg}
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" /></svg>
        </a>
      </div>
      <div className="er__loop" data-er-loop="">
        <ul className="er__raster" data-er-raster="">
          {tegels.map((x) =>
            x.soort === 'case' ? (
              <li key={x.c.slug} className="er__item">
                <article className="er__case">
                  { }
                  <img className="er__beeld" src={`/beeld/${x.c.slug}-omslag-480.webp`} srcSet={`/beeld/${x.c.slug}-omslag-480.webp 480w, /beeld/${x.c.slug}-omslag-720.webp 720w`} sizes="(min-width: 721px) 24vw, 46vw" alt="" width={480} height={640} loading="lazy" decoding="async" />
                  <div className="er__voet">
                    <div className="er__kopgroep">
                      <span className="er__label">{x.c.eigenProduct ? t.eigen : t.klant}</span>
                      <h3 className="er__titel"><a href={`/work/${x.c.slug}`}>{x.c.naam}</a></h3>
                    </div>
                    <ul className="er__lade" aria-label={t.klant}><li>{domein(x.c.url)}</li></ul>
                  </div>
                </article>
              </li>
            ) : (
              <li key={x.d.slug} className="er__item">
                <figure className="er__tegel">
                  { }
                  <img src={`/demo/${x.d.slug}-390.webp`} alt="" width={300} height={649} loading="lazy" decoding="async" />
                  <figcaption className="er__label">{t.demo} · {x.d.naam}</figcaption>
                </figure>
              </li>
            ),
          )}
        </ul>
      </div>
    </EindeloosRaster>
    {/* De lijst staat buiten de wand: daar houdt de plakkende knop "Alles als lijst" op. */}
    <section className="er alles-lijst" aria-labelledby="alles-lijst-kop">
      <div className="er__einde container-site" id="alles-lijst" tabIndex={-1}>
        <h2 id="alles-lijst-kop">{t.lijstKop}</h2>
        <ol className="er__lijst">
          {cases.map((c) => (
            <li key={c.slug}><a href={`/work/${c.slug}`}>{c.naam} <span>{c.eigenProduct ? t.eigen : t.klant} · {domein(c.url)}</span></a></li>
          ))}
          {demos.map((d) => (
            <li key={d.slug}><a href={demoUrl(d.slug)} target="_blank" rel="noopener noreferrer">{d.naam} <span>{t.demo} · {d.beroep}, {d.plaats} <span aria-hidden="true">↗</span></span></a></li>
          ))}
        </ol>
      </div>
    </section>
    </>
  )
}
