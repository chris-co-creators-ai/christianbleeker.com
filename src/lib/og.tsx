import { ImageResponse } from 'next/og'

import { kop } from '@/content/teksten'

export const OG_SIZE = { width: 1200, height: 630 }
const ondertitelMerk = kop.ondertitel

/**
 * Gedeelde 1200×630-deelafbeelding voor `src/app/(nl)/opengraph-image.tsx` (en de `[locale]`-
 * tegenhanger) — neutrale zwart-op-wit-tokens, zie `globals.css`.
 *
 * ── Bewust géén eigen lettertype ────────────────────────────────────────────
 * `next/og`'s `ImageResponse` (Satori/resvg) kan struikelen over een variabel lettertype met een
 * ongewone `fvar`-tabel — Satori se eigen systeemfont (een generieke schreefloze) is hier het
 * lazy én werkende antwoord. Wil je een merklettertype in de deelafbeelding, converteer dan eerst
 * een vaste snit (bv. `wght 700`) naar een statische TTF en geef die hier mee via de
 * `fonts`-optie van `ImageResponse`.
 */
export function ogImage(titel: string, ondertitel: string): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '80px', background: '#17110f', color: '#f5ece3',
        }}
      >
        <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Chris Bleeker<span style={{ color: '#f0533a', margin: '0 16px' }}>×</span>
          <span style={{ color: '#c9bfb6', fontWeight: 400 }}>{ondertitelMerk}</span>
        </div>
        <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.02, maxWidth: 1000 }}>
          {titel}
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: '#a8e0d6', maxWidth: 1000 }}>{ondertitel}</div>
      </div>
    ),
    OG_SIZE,
  )
}
