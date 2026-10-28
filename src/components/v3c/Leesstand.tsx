'use client'

import { useEffect, useId, useRef } from 'react'
import { kop, linkedin } from '@/content/teksten'
import { v3c } from '@/content/v3c'
import { init as initRichting } from '@/features/scroll-richting-nav/scroll-richting-nav.js'
import '@/features/scroll-richting-nav/scroll-richting-nav.css'
import { init as initFlip } from '@/features/flip-side-menu/flip-side-menu.js'
import '@/features/flip-side-menu/flip-side-menu.css'
import { VelMenu } from '@/features/vel-menu/VelMenu'
import { LogoKleurwissel } from '@/features/logo-kleurwissel/LogoKleurwissel'
import { ChecklistKnop } from '@/components/ChecklistKnop'
import { ThemaKnop } from '@/components/ThemaKnop'
import './leesstand.css'

/**
 * De leesstand van de kop (v3). Bovenaan staat de volle kop: de pil (desktop) of merk + thema + beeldmenu
 * (telefoon/tablet). Scrol je omlaag, dan wijkt die kop (scroll-richting-nav) en blijven er twee dingen staan:
 * het merk links, dat van kleur wisselt boven een omgekeerd vlak (logo-kleurwissel), en één menuknop rechts.
 * Die knop opent op desktop het zijmenu (flip-side-menu) en op telefoon/tablet het vel (vel-menu). Scrol je
 * terug, dan komt de volle kop terug en verdwijnt de leesstand. De twee menu's zijn er dus nooit tegelijk.
 */
export function Leesstand({ pad }: { pad: string }) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const fsmRef = useRef<HTMLDivElement | null>(null)
  const fsmPaneel = useId()
  const velId = 'leesmenu'
  const actief = (href: string) => (href === '/' ? pad === '/' : pad.startsWith(href))

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const uit: Array<() => void> = []
    for (const [sel, attr] of [['.kop-desktop .pn', 'data-weg-d'], ['.kop-mobiel', 'data-weg-m']] as const) {
      const el = document.querySelector(sel)
      if (el) uit.push(initRichting(el, { onChange: (weg: boolean) => root.toggleAttribute(attr, weg) }))
    }
    if (fsmRef.current) uit.push(initFlip(fsmRef.current))
    return () => uit.forEach((f) => f())
  }, [])

  const links = kop.links.map((l) => ({ ...l, huidig: actief(l.href) }))

  return (
    <div ref={rootRef} className="ls">
      <LogoKleurwissel label={v3c.leesstand.logoLabel} href="/" className="ls-logo">
        <span data-vel-merk="" aria-hidden="true">{kop.merk}</span>
      </LogoKleurwissel>

      {/* Desktop: zijmenu met de flip-knop */}
      <div ref={fsmRef} className="fsm ls-fsm">
        <button type="button" className="fsm__button" aria-expanded="false" aria-controls={fsmPaneel} data-fsm-button="">
          <span className="fsm__button-face" data-fsm-face="closed" aria-hidden="true">{kop.menu}</span>
          <span className="fsm__button-face" data-fsm-face="open" aria-hidden="true">{v3c.leesstand.sluit}</span>
          <span className="ls-sr">{kop.menu}</span>
        </button>
        <div id={fsmPaneel} className="fsm__panel" data-fsm-panel="">
          <nav className="fsm__nav" aria-label={v3c.leesstand.navLabel}>
            <ul className="fsm__list">
              {links.map((l) => (
                <li key={l.href} data-fsm-item="">
                  <a href={l.href} aria-current={l.huidig ? 'page' : undefined}>
                    {l.label}<span className="fsm__arrow" aria-hidden="true">→</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="fsm__meta ls-meta">
              <ChecklistKnop className="ls-meta__link">{kop.checklist}</ChecklistKnop>
              <a className="ls-meta__link" href={linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <span aria-hidden="true">↗</span></a>
              <ThemaKnop className="ls-thema" />
            </div>
          </nav>
        </div>
      </div>

      {/* Telefoon en tablet: het vel */}
      <button
        type="button"
        className="ls-vel-knop"
        aria-controls={velId}
        // @ts-expect-error invoker-commando's: zonder JS opent de knop het vel toch
        commandfor={velId}
        command="show-modal"
      >
        {kop.menu}
      </button>
      <VelMenu id={velId} label={v3c.leesstand.navLabel} logo={<span aria-hidden="true">{kop.merk}</span>} sluitInhoud={<span aria-hidden="true">×</span>} sluitClassName="ls-vel-sluit">
        <ul data-vel-stap="" className="ls-vel-lijst">
          {links.map((l) => (
            <li key={l.href}><a href={l.href} aria-current={l.huidig ? 'page' : undefined}>{l.label}</a></li>
          ))}
        </ul>
        <div data-vel-stap="" className="ls-meta ls-meta--vel">
          <ChecklistKnop className="ls-meta__link">{kop.checklist}</ChecklistKnop>
          <a className="ls-meta__link" href={linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <span aria-hidden="true">↗</span></a>
          <ThemaKnop className="ls-thema" />
        </div>
      </VelMenu>
    </div>
  )
}
