'use client'

import { LinkDialogFunnel, type LinkDialogFunnelFieldDef } from '@/features/link-dialog-funnel/LinkDialogFunnel'
import '@/features/link-dialog-funnel/link-dialog-funnel.css'
import { werkplaats } from '@/content/werkplaats'

/**
 * Proefstuk "Voor een advocatenkantoor" (link-dialog-funnel). De knoppen openen de aanvraag in een dialoog met
 * de interesse uit de link al gekozen. Het is een voorbeeld: versturen wacht even en verstuurt niets.
 * Zonder JavaScript gaan de knoppen naar /contact. Alles hier staat buiten de component, zodat init niet
 * bij elke render opnieuw draait.
 */
const t = werkplaats.funnel
const velden: LinkDialogFunnelFieldDef[] = [
  { name: 'naam', type: 'text', label: t.velden.naam, required: true, autoComplete: 'name' },
  { name: 'email', type: 'email', label: t.velden.email, required: true, autoComplete: 'email' },
  { name: 'vraag', type: 'textarea', label: t.velden.vraag },
]
const linkMatch = (href: string) => href.includes('interesse=')
const nietsVersturen = () => new Promise<void>((klaar) => setTimeout(klaar, 400))

export function Intake() {
  return (
    <LinkDialogFunnel
      className="wp-intake"
      linkMatch={linkMatch}
      interests={t.interesses}
      contactFields={velden}
      texts={t.teksten}
      onSubmit={nietsVersturen}
      privacyHref="/privacy"
    >
      {t.links.map((l, i) => (
        <a key={l.interesse} className={i === 0 ? 'knop' : 'knop knop--rand'} href={`/contact?interesse=${l.interesse}`}>
          {l.tekst}
        </a>
      ))}
    </LinkDialogFunnel>
  )
}
