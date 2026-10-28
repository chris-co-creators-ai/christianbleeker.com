'use client'

import { useEffect, useRef } from 'react'
import { init } from '@/features/justify-fill/justify-fill.js'
import '@/features/justify-fill/justify-fill.css'

/**
 * justify-fill met een ResizeObserver: de kern meet alleen bij init, `resize` op window en fonts.ready.
 * Staat het blok bij de eerste meting nog niet in de layout (alles op offsetTop 0), dan bleven alle woorden
 * op één regel staan en liep de zin buiten beeld (gezien in een volle schermopname, 28-10). Hier meet hij
 * opnieuw zodra de breedte van het blok zelf verandert, ook van 0 naar echt.
 */
export function UitgevuldeZin({ children, className }: { children: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let destroy = init(el)
    let breedte = el.clientWidth
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === breedte) return
      breedte = el.clientWidth
      destroy()
      destroy = init(el)
    })
    ro.observe(el)
    return () => { ro.disconnect(); destroy() }
  }, [children])
  return (
    <p ref={ref} data-justify-fill="" className={className} suppressHydrationWarning>
      {children}
    </p>
  )
}
