'use client'

import { useEffect, useRef, useState } from 'react'
import { init } from '@/features/live-demo-kader/live-demo-kader.js'
import '@/features/live-demo-kader/live-demo-kader.css'
import './case-kader.css'
import { casePagina } from '@/content/teksten'

/**
 * De echte site van de klant in een browservenster (live-demo-kader). Eerst een schermbeeld; laat de site
 * zich inbedden (src/content/kader.ts), dan laadt "Laad de echte site hier" hem live in het venster. Tot die
 * klik gaat er niets naar de klantsite. Op een telefoon (smal kader) opent het venster schermvullend, en
 * daar laadt de live site meteen mee: de bezoeker koos er zelf voor.
 */
export function CaseKader({ slug, naam, url, live: liveUrl }: { slug: string; naam: string; url: string; live?: string }) {
  const t = casePagina.kader
  const ref = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)
  const [smal, setSmal] = useState(false) // kader in de smalle stand (teaser): daar opent de knop van het kader zelf het venster
  const host = new URL(url).hostname

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const destroy = init(root, {
      type: 'browser', adresBasis: host, poster: `/beeld/${slug}-kader-900.webp`,
      meldingTekst: t.melding, openTekst: t.open, sluitTekst: t.sluit, posterAlt: casePagina.schermAlt(naam),
    })
    // Site die zich niet laat inbedden: het schermvullende venster zou alleen hetzelfde beeld groter tonen.
    const teaserKnop = root.querySelector<HTMLButtonElement>('.ldk-teaser .ldk-knop')
    if (teaserKnop && !liveUrl) teaserKnop.hidden = true
    const opDialoog = (e: Event) => {
      if (liveUrl && (e.target as Element).closest?.('.ldk-teaser .ldk-knop')) setLive(true)
    }
    root.addEventListener('click', opDialoog)
    const stand = () => setSmal(root.dataset.ldkModus === 'teaser')
    stand()
    const mo = new MutationObserver(stand)
    mo.observe(root, { attributes: true, attributeFilter: ['data-ldk-modus'] })
    return () => { mo.disconnect(); root.removeEventListener('click', opDialoog); destroy() }
  }, [slug, naam, host, liveUrl, t])

  return (
    <>
      <div ref={ref} className="case-kader" data-demo-kader="" data-demo-type="browser" data-live={live ? '' : undefined} data-kan-live={liveUrl ? '' : undefined}>
        <a className="ldk-skip" href={`#na-kader-${slug}`}>{t.skip}</a>
        <div className="ldk-kop">
          <p className="ldk-markering" data-demo-markering="">{live ? t.live : t.beeld}</p>
          {liveUrl && !live && !smal ? (
            <button type="button" className="knop knop--rand case-kader__laad" onClick={() => setLive(true)}>{t.laad}</button>
          ) : null}
        </div>
        <div className="ldk-vak" data-demo-vak="">
          <div className="ldk-venster" data-demo-venster="" role="group" aria-label={t.label(naam)}>
            <div className="ldk-balk">
              <span className="ldk-stippen" aria-hidden="true"><span className="ldk-stip" /><span className="ldk-stip" /><span className="ldk-stip" /></span>
              <div className="ldk-adres">
                <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 5V3.8a2.5 2.5 0 0 1 5 0V5M2.5 5h7v5.5h-7z" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
                <span data-demo-adres="" />
              </div>
            </div>
            <div className="ldk-body">
              <div className="ldk-schermen">
                <section data-demo-scherm="home" data-demo-pad="/" data-demo-titel={naam} className="case-kader__scherm">
                  {live && liveUrl ? (
                    <iframe src={liveUrl} title={t.titel(naam)} referrerPolicy="strict-origin-when-cross-origin" />
                  ) : (
                     
                    <img src={`/beeld/${slug}-kader-1680.webp`} srcSet={`/beeld/${slug}-kader-900.webp 900w, /beeld/${slug}-kader-1680.webp 1680w`} sizes="(min-width: 900px) 760px, 92vw" alt={casePagina.schermAlt(naam)} width={1680} height={1020} loading="lazy" decoding="async" />
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
      <span id={`na-kader-${slug}`} tabIndex={-1} />
    </>
  )
}
