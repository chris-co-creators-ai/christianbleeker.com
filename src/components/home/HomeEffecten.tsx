'use client'

import { useEffect } from 'react'
import { minderBeweging } from '@/_kwaliteit/basis.js'
import { init as filmKorrel } from '@/features/film-grain/film-grain.js'
import { init as kinetisch } from '@/features/kinetic-type/kinetic-type.js'
import { init as letterRol } from '@/features/letter-rol/letter-rol.js'
import { init as verhaal } from '@/features/story-word-light/story-word-light.js'
import { init as opkomst } from '@/features/footer-opkomst/footer-opkomst.js'
import '@/features/film-grain/film-grain.css'
import '@/features/kinetic-type/kinetic-type.css'
import '@/features/letter-rol/letter-rol.css'
import '@/features/story-word-light/story-word-light.css'
import '@/features/footer-opkomst/footer-opkomst.css'
import './korrel.css'
import './kinetisch.css'
import './rol.css'
import './verhaal.css'
import './opkomst.css'

type Stop = () => void

/**
 * Start de effecten van de Home op markup die de pagina zelf rendert (geen eigen DOM):
 * filmkorrel over de TEDx-foto, de dienstkoppen die dichtdrukken, de knoppen die rollen, de
 * alinea van "Over mij" die woord voor woord oplicht, en de voet die op zijn plek zakt.
 */
export function HomeEffecten() {
  useEffect(() => {
    const stops: Stop[] = []
    const op = <T extends Element>(sel: string, fn: (el: T) => Stop | void) => {
      const el = document.querySelector<T>(sel)
      if (el) { const s = fn(el); if (s) stops.push(s) }
    }
    op('.hero', (el) => filmKorrel(el, { sterkte: 0.11, fps: 10, tegelGrootte: 180 }))
    op('main', (el) => letterRol(el))
    op('.over-swl', (el) => verhaal(el))
    op('footer[data-opkomst]', (el) => opkomst(el))
    // beeldexplosie: de poster wijkt pas als de reel echt beeld geeft (breedte bekend en de tijd loopt).
    // Speelt een browser het formaat niet af, of komt er een fout, dan blijft de poster staan.
    op<HTMLVideoElement>('.werk-explosie .bx__kaart video', (v) => {
      const kaart = v.parentElement!
      const kijk = () => kaart.toggleAttribute('data-video-speelt', !v.error && v.videoWidth > 0 && v.readyState >= 2 && v.currentTime > 0)
      const fout = () => kaart.removeAttribute('data-video-speelt')
      const events = ['timeupdate', 'playing', 'loadeddata', 'emptied'] as const
      events.forEach((e) => v.addEventListener(e, kijk))
      v.addEventListener('error', fout)
      v.querySelectorAll('source').forEach((s) => s.addEventListener('error', fout))
      return () => { events.forEach((e) => v.removeEventListener(e, kijk)); v.removeEventListener('error', fout) }
    })
    // kinetic-type kent zelf geen "minder beweging": dan blijft de kop gewoon vol (kinetisch.css).
    let stopKt: Stop | undefined
    const start = (reduced: boolean) => {
      stopKt?.(); stopKt = undefined
      const doen = document.querySelector('.doen')
      if (!reduced && doen) stopKt = kinetisch(doen, { minWeight: 300, maxWeight: 800, minAlpha: 0.55 })
    }
    const mb = minderBeweging(start, document)
    start(mb.reduced)
    return () => { stops.forEach((s) => s()); stopKt?.(); mb.stop() }
  }, [])
  return null
}
