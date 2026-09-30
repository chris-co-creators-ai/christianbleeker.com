import { SectieDock } from '@/features/sectie-dock/SectieDock'
import { voet, home } from '@/content/teksten'

/**
 * De CTA-schijf rechtsonder (sectie-dock): bij het werk "Bekijk alle projecten", daarbuiten
 * "Stuur me een bericht". Verdwijnt in de voet (`data-dock-verberg`).
 */
export function Dock({ verberg }: { verberg?: string }) {
  const bericht = voet.bericht.replace(' ↗', '')
  const standaard = { tekst: bericht, href: '/contact' }
  return (
    <SectieDock
      href="/contact"
      pil
      secties={verberg ? {} : { werk: { tekst: home.werk.alle, href: '/work' }, doen: standaard, over: standaard, producten: standaard }}
      standaard={standaard}
      toonNa={verberg ? 0 : '.hero'}
      {...(verberg ? { verberg: `[data-dock-verberg], ${verberg}` } : {})}
    >
      {bericht}
    </SectieDock>
  )
}
