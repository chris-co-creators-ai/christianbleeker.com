import type { CSSProperties } from 'react'
import { Beeldexplosie } from '@/features/beeldexplosie/Beeldexplosie'
import { homeV2 } from '@/content/teksten'
import './explosie.css'

/**
 * beeldexplosie als opening van "Werk" op de Home (de hero blijft de TEDx-foto, daarom een h2).
 * Elf omslagen van klantsites springen rond de kop en vliegen bij het scrollen naar buiten; in het
 * midden groeit een showreel van alle dertien sites. Plekken: desktop --l/--t/--b, mobiel --ml/--mt/--mb.
 */
const BEELDEN: { slug: string; uit: [number, number, number]; golf: number; stijl: string; mobiel?: false }[] = [
  { slug: 'human-margin', uit: [-230, -40, 3], golf: 0, stijl: '--l:-2%;--t:12%;--b:12%;--ml:-8%;--mt:6%;--mb:30%' },
  { slug: 'fuselabs', uit: [-120, -170, 2.2], golf: 1, stijl: '--l:15%;--t:3%;--b:11%;--ml:30%;--mt:-2%;--mb:24%' },
  { slug: 'offbeat-peak', uit: [-20, -230, 1.8], golf: 2, stijl: '--l:37%;--t:-6%;--b:9%', mobiel: false },
  { slug: 'souplesse-runners-boutique', uit: [90, -240, 2], golf: 0, stijl: '--l:62%;--t:4%;--b:9%;--ml:62%;--mt:4%;--mb:24%' },
  { slug: 'stratenova-advisory', uit: [170, -60, 1.6], golf: 3, stijl: '--l:82%;--t:14%;--b:13%;--ml:88%;--mt:22%;--mb:22%' },
  { slug: 'kinderopvang-ikke', uit: [-330, 10, 2.6], golf: 1, stijl: '--l:4%;--t:50%;--b:9%', mobiel: false },
  { slug: 'digital-waves', uit: [280, 60, 2.4], golf: 2, stijl: '--l:91%;--t:56%;--b:10%', mobiel: false },
  { slug: 'driftawave', uit: [-180, 420, 1.25], golf: 3, stijl: '--l:30%;--t:74%;--b:7%', mobiel: false },
  { slug: 'hoveniersbedrijf-nijboer', uit: [-160, 150, 2.4], golf: 0, stijl: '--l:13%;--t:70%;--b:11%;--ml:-4%;--mt:72%;--mb:28%' },
  { slug: 'seveke-creative', uit: [20, 300, 1.8], golf: 2, stijl: '--l:50%;--t:80%;--b:9%;--ml:36%;--mt:82%;--mb:24%' },
  { slug: 'win-instituut', uit: [150, 190, 2.8], golf: 1, stijl: '--l:70%;--t:66%;--b:12%;--ml:76%;--mt:70%;--mb:28%' },
]

export function WerkExplosie() {
  const t = homeV2.explosie
  return (
    <Beeldexplosie labelledBy="werk-explosie-kop" className="werk-explosie" introPerSessie>
      <div className="bx__spoor" data-bx-spoor="">
        <div className="bx__podium" data-bx-podium="">
          <div className="bx__veld">
            <ul className="bx__beelden" aria-hidden="true">
              {BEELDEN.map((b) => (
                <li key={b.slug} className="bx__beeld" data-bx-beeld="" data-uit-x={b.uit[0]} data-uit-y={b.uit[1]} data-uit-schaal={b.uit[2]} data-golf={b.golf} data-bx-mobiel={b.mobiel === false ? 'nee' : undefined} style={Object.fromEntries(`${b.stijl};--r:3/4`.split(';').map((d) => d.split(':'))) as CSSProperties}>
                  <div className="bx__binnen" data-bx-binnen="">
                    <img src={`/beeld/${b.slug}-omslag-480.webp`} srcSet={`/beeld/${b.slug}-omslag-480.webp 480w, /beeld/${b.slug}-omslag-720.webp 720w`} sizes="(max-width: 720px) 34vw, 14vw" alt="" width={480} height={640} loading="lazy" decoding="async" />
                  </div>
                </li>
              ))}
            </ul>
            <div className="bx__tekst">
              <h2 className="bx__kop" id="werk-explosie-kop">
                <span className="bx__regel" data-bx-regel=""><span>{t.kop[0]}</span></span>
                <span className="bx__regel bx__regel--accent" data-bx-regel=""><span>{t.kop[1]}</span></span>
              </h2>
            </div>
          </div>
          <div className="bx__kaart" data-bx-kaart="">
            <video muted loop playsInline preload="none" controls poster="/videos/werk-reel-poster.webp" width={1200} height={800} aria-label={t.reelLabel}>
              <source src="/videos/werk-reel-mobiel.webm" type="video/webm" media="(max-width: 720px)" />
              <source src="/videos/werk-reel-mobiel.mp4" type="video/mp4" media="(max-width: 720px)" />
              <source src="/videos/werk-reel.webm" type="video/webm" />
              <source src="/videos/werk-reel.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </div>
    </Beeldexplosie>
  )
}
