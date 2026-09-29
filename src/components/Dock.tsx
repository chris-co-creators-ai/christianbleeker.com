import { SectieDock } from '@/features/sectie-dock/SectieDock'
import { voet, home } from '@/content/teksten'

/**
 * De CTA-schijf rechtsonder (sectie-dock): bij het werk "Bekijk alle projecten", daarbuiten
 * "Stuur me een bericht". Verdwijnt in de voet (`data-dock-verberg`).
 */
export function Dock() {
  const bericht = voet.bericht.replace(' ↗', '')
  return (
    <SectieDock
      href="/contact"
      pil
      secties={{ werk: { tekst: home.werk.alle, href: '/work' } }}
      standaard={{ tekst: bericht, href: '/contact' }}
      toonNa=".hero"
    >
      {bericht}
    </SectieDock>
  )
}
