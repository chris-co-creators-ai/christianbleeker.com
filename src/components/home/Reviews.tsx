'use client'

import { useEffect, useRef } from 'react'
import { init } from '@/features/review-wall/review-wall.js'
import '@/features/review-wall/review-wall.css'
import { homeV2 } from '@/content/teksten'
import './reviews.css'

/**
 * review-wall op de Home, met VOORBEELDREVIEWS: verzonnen teksten die tonen hoe deze plek eruitziet tot
 * er echte reviews van klanten zijn. Dat staat in de kop, in de toelichting en op elke kaart. Geen
 * datum, geen bron en geen score-badge (de markup laat `[data-rw-score]` bewust weg): een gemiddelde
 * zou een echte meting suggereren.
 */
export function Reviews({ nummer }: { nummer: string }) {
  const t = homeV2.reviews
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => (ref.current ? init(ref.current, { reviews: t.items, weergave: 'raster' }) : undefined), [t.items])
  return (
    <section id="reviews" className="sectie container-site reviews-blok" aria-labelledby="reviews-kop">
      <div className="sectie-kop" data-reveal="">
        <p className="nr">{nummer}</p>
        <h2 id="reviews-kop">{t.kop}</h2>
        <p className="sectie-tekst"><span className="reviews-label">{t.label}</span> {t.toelichting}</p>
      </div>
      <div data-reveal="">
        <div ref={ref} className="rw reviews-wand" data-review-wall="" data-weergave="raster">
          <ul className="rw__lijst" data-rw-lijst="" />
        </div>
      </div>
    </section>
  )
}
