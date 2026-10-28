import { werk } from '@/content/teksten'
import { demos, demoUrl } from '@/content/demos'
import { DragCarousel } from '@/features/drag-carousel/DragCarousel'
import { DeviceMockup } from '@/features/device-mockup/DeviceMockup'

/**
 * De twintig ontwerp-demo's op /work, na de echte klanten. Bewust anders dan de klanttegels: toestellen
 * in een sleepbare rij (drag-carousel, gridlijn + voortgangsduim) en per demo het label "Ontwerp-demo".
 * De laptop is het device-mockup-onderdeel (focusbaar); de telefoon ernaast is decoratief.
 */
export function Demos() {
  const d = werk.demos
  return (
    <section id="demos" className="sectie demo-sectie" aria-labelledby="demos-kop">
      <div className="sectie-kop container-site demo-kop">
        <p className="kicker">{d.kicker}</p>
        <h2 id="demos-kop">{d.kop}</h2>
        <p className="sectie-tekst">{d.tekst}</p>
      </div>
      <DragCarousel
        className="demo-rij"
        label={d.carousel}
        gridlijn=".demo-kop"
        voortgang
        slides={demos.map((x) => (
          <article key={x.slug} className="demo-kaart">
            <div className="demo-toestellen">
              <DeviceMockup device="laptop" src={`/demo/${x.slug}-1440.webp`} alt={d.schermAlt(x.naam)} className="demo-laptop" />
              <figure data-device="phone" className="demo-telefoon" aria-hidden="true">
                <div className="dm-frame">
                  <div className="dm-notch" />
                  <div className="dm-screen" data-device-screen>
                    <img src={`/demo/${x.slug}-390.webp`} alt="" loading="lazy" width={300} height={649} />
                  </div>
                </div>
              </figure>
            </div>
            <div className="demo-tekst">
              <p className="demo-label">{d.label}</p>
              <h3 className="demo-naam">{x.naam}</h3>
              <p className="demo-vak">{x.beroep} <span aria-hidden="true">·</span> {x.plaats}</p>
              <a className="knop knop--rand demo-link" href={demoUrl(x.slug)} target="_blank" rel="noopener noreferrer" aria-label={d.bekijkAlt(x.naam)}>
                {d.bekijk} <span className="pijl pijl--uit" aria-hidden="true">↗</span>
              </a>
            </div>
          </article>
        ))}
      />
    </section>
  )
}
