/**
 * <picture> met AVIF en WebP uit `public/beeld/` (gemaakt door `scripts/beeld.mjs`).
 * `naam` zonder maat en extensie; `maten` = de breedtes die het script maakte (leeg = één maat).
 */
export function Beeld({
  naam, maten = [], sizes = '100vw', alt, breedte, hoogte, className, prioriteit = false,
}: {
  naam: string
  maten?: number[]
  sizes?: string
  alt: string
  breedte: number
  hoogte: number
  className?: string
  prioriteit?: boolean
}) {
  const set = (ext: string) =>
    maten.length ? maten.map((m) => `/beeld/${naam}-${m}.${ext} ${m}w`).join(', ') : `/beeld/${naam}.${ext}`
  const src = maten.length ? `/beeld/${naam}-${maten[Math.min(1, maten.length - 1)]}.webp` : `/beeld/${naam}.webp`
  return (
    <picture>
      <source type="image/avif" srcSet={set('avif')} sizes={maten.length ? sizes : undefined} />
      <img
        src={src}
        srcSet={maten.length ? set('webp') : undefined}
        sizes={maten.length ? sizes : undefined}
        alt={alt}
        width={breedte}
        height={hoogte}
        className={className}
        loading={prioriteit ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={prioriteit ? 'high' : undefined}
      />
    </picture>
  )
}

export const OMSLAG = { maten: [480, 720, 960], breedte: 1086, hoogte: 1448 }
export const SCHERM = { maten: [900, 1500], breedte: 1499, hoogte: 1049 }
