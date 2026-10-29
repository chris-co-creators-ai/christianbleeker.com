'use client'

import { useEffect } from 'react'
import { init as binnenkomst } from '@/features/binnenkomst/binnenkomst.js'
import { init as blurWoorden } from '@/features/blur-woorden/blur-woorden.js'
import { init as letterReveal } from '@/features/letter-reveal/letter-reveal.js'
import '@/features/binnenkomst/binnenkomst.css'
import '@/features/blur-woorden/blur-woorden.css'
import '@/features/letter-reveal/letter-reveal.css'
import './effecten.css'

/**
 * v3e — site-brede choreografie van invoeg- en draai-effecten (29-10: "meer invoeg effecten en draai
 * effecten, over de hele site"). Eén plek, geen paginacode: dit onderdeel zet na het laden generieke
 * data-attributen op elementen in <main> en start daarop de bibliotheekonderdelen.
 *
 *  - sectiekoppen: woord voor woord scherp (blur-woorden), het × van het nummer draait een kwartslag,
 *    de ondertekst stijgt op met een lichte blur (binnenkomst)
 *  - h1 op tekstpagina's, cases, Werkplaats en 404: letter voor letter (letter-reveal)
 *  - kaarten: vanuit een 3D-hoek rechtop (reveal-on-scroll-variant of binnenkomst `kantel`)
 *  - beelden: schuiven open in hun kader (binnenkomst `masker`); enkele beelden kantelen mee op scroll (CSS)
 *
 * De grote momenten (intro, beeldexplosie, stapelpanelen, diepte-beeld, raster-intro, hero's, voet) en alles
 * wat al een eigen beweging heeft, worden overgeslagen (UIT). Zonder JS en bij minder beweging: niets
 * verborgen; de onderdelen zetten hun verborgen staat dan nooit.
 */

/** Hier nooit iets bij: de grote momenten en onderdelen met hun eigen beweging. */
const UIT = [
  '.hero', '[data-punt-zoom-intro]', '.werk-explosie', '.stapel', '.ai-diepte', '.werk-raster', '.over-swl', '.over-kop',
  '.contact-links', '.wp-hond', '.ai-vnv', '.volgende-stapel', '.alles-wand', '.reis', '.statement', '.logowand',
  '.bekend', '.ervaringen', '.reviews-wand', '.prijzen', '.pakket-advies', '.kennismaken', '.wp-kaart', 'form',
  '[data-kz-modus]', '.case-flip', '[data-story-text]', '[data-kinetic-type]', '[data-hero-stage]', 'dialog',
].join(', ')

type Doel = { sel: string; soort: 'stijg' | 'kantel' | 'masker' | 'kwart'; groep?: boolean }

/** Losse elementen voor `binnenkomst` (alleen buiten [data-reveal]: daar beweegt reveal-on-scroll al). */
const BINNENKOMST: Doel[] = [
  { sel: '.sectie-kop > .sectie-tekst', soort: 'stijg' },
  { sel: '.sectie-kop > .kicker', soort: 'stijg' },
  { sel: '.tel', soort: 'stijg', groep: true },
  { sel: '.team-kaart-foto img, .eigen-creators-beeld img, .case-scherm img', soort: 'masker' },
  { sel: '.case-terug', soort: 'stijg' },
  { sel: '.case-halte > .kicker, .case-halte > .case-kort, .case-halte > .case-alinea, .case-extern', soort: 'stijg' },
  { sel: '.tekstpagina > section', soort: 'stijg' },
  { sel: '.niet-gevonden > p:not(.niet-gevonden-x), .niet-gevonden > .knop', soort: 'stijg' },
  { sel: '.niet-gevonden-x .x', soort: 'kwart' },
  { sel: '.wp-hero-tekst > .kicker, .wp-intro, .wp-eerlijk', soort: 'stijg' },
  { sel: '.wp-inhoud ol', soort: 'stijg', groep: true },
  { sel: '.wp-inhoud-nr', soort: 'kwart' },
  { sel: '.proefstuk-meta', soort: 'stijg', groep: true },
  { sel: '.proefstuk-bank:not(.proefstuk-bank--kaal)', soort: 'kantel' },
  { sel: '.ai-kop-tekst > .ai-tweede', soort: 'stijg' },
]

/** Kaarten die al met reveal-on-scroll binnenkomen: die beweging wordt een kanteling (geen tweede beweging erbij).
 * Niet de teamkaarten en Co-Creators: daar opent het beeld in zijn kader (masker) en stijgt de kaart gewoon. */
const KANTEL_ROS = '.eigen-kaart:not(.eigen-creators), .tegel, .doen-item, .ai-item, .gesprek-item'

/** Koppen die letter voor letter binnenkomen (h1 zonder eigen hero-moment). */
const LETTERS = '.tekstpagina > h1, .niet-gevonden > h1, .case-h1, .wp-h1'

export function Effecten() {
  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return
    const vrij = (el: Element) => !el.closest(UIT)
    const opruimen: (() => void)[] = []

    // 1. Sectiekoppen: woorden scherp, × kwartslag. Een kop die zelf [data-reveal] is, stijgt dan niet nog eens.
    for (const kop of main.querySelectorAll<HTMLElement>('.sectie-kop')) {
      if (!vrij(kop) || kop.querySelector('[data-pr-ready], .pr__mask, [data-password-reveal]')) continue
      const h = kop.querySelector('h2, h3')
      if (!h) continue
      kop.setAttribute('data-v3e-kop', '')
      opruimen.push(blurWoorden(kop, { drempel: 0.3 }))
      const nr = kop.querySelector(':scope > .nr')
      if (nr) nr.setAttribute('data-binnenkomst', 'kwart')
      opruimen.push(() => { kop.removeAttribute('data-v3e-kop'); nr?.removeAttribute('data-binnenkomst') })
    }

    // 2. Kaarten met reveal-on-scroll: kantelen in plaats van opschuiven; naast elkaar licht gestaggerd.
    main.querySelectorAll<HTMLElement>(KANTEL_ROS).forEach((k, i) => {
      if (!vrij(k) || !k.hasAttribute('data-reveal')) return
      k.setAttribute('data-v3e-ros', 'kantel')
      if (k.classList.contains('tegel')) k.style.setProperty('--reveal-delay', `${(i % 2) * 0.08}s`)
      opruimen.push(() => k.removeAttribute('data-v3e-ros'))
    })

    // 3. Losse elementen voor binnenkomst.
    for (const d of BINNENKOMST) {
      for (const el of main.querySelectorAll(d.sel)) {
        if (!vrij(el) || el.hasAttribute('data-binnenkomst')) continue
        // In een [data-reveal]-blok beweegt reveal-on-scroll al; alleen een beeld dat in zijn kader opent mag
        // erbij (dat is de aankomst van dezelfde kaart), en een sectiekop waarvan de stijging hierboven is uitgezet.
        const ros = el.closest('[data-reveal]')
        if (ros && d.soort !== 'masker' && !ros.hasAttribute('data-v3e-kop')) continue
        el.setAttribute('data-binnenkomst', d.soort)
        if (d.groep) el.setAttribute('data-binnenkomst-groep', '')
        opruimen.push(() => { el.removeAttribute('data-binnenkomst'); el.removeAttribute('data-binnenkomst-groep') })
      }
    }
    opruimen.push(binnenkomst(main))

    // 4. h1 letter voor letter: de tekst komt in één regel-span; inline-elementen (zoals het ×) blijven staan.
    for (const h of main.querySelectorAll<HTMLElement>(LETTERS)) {
      if (!vrij(h) || h.hasAttribute('data-letter-reveal')) continue
      const tekst = [...h.childNodes].find((n) => n.nodeType === 3 && n.textContent?.trim())
      if (!tekst) continue
      const regel = document.createElement('span')
      regel.setAttribute('data-lr-line', '')
      h.replaceChild(regel, tekst)
      regel.appendChild(tekst)
      h.setAttribute('data-letter-reveal', '')
      h.setAttribute('data-v3e-letters', '')
      const stop = letterReveal(h, { duration: 0.7, stagger: 0.028 })
      opruimen.push(() => {
        stop()
        const r = h.querySelector(':scope > [data-lr-line]')
        if (r) h.replaceChild(document.createTextNode(r.textContent || ''), r)
        h.removeAttribute('data-letter-reveal')
        h.removeAttribute('data-v3e-letters')
      })
    }

    return () => { for (const f of opruimen.reverse()) f() }
  }, [])
  return null
}
