import { voet, kop, linkedin } from '@/content/teksten'
import { LetterReveal } from '@/features/letter-reveal/LetterReveal'
import { WijzigToestemmingKnop } from '@/features/toestemming/WijzigToestemmingKnop'
import { ChecklistKnop } from '@/components/ChecklistKnop'

/**
 * Voet op elke pagina: merk, menu, privacy en (in de korte voet) de checklist als gewone link,
 * zodat hij ook op een telefoon overal te vinden is. Met `uitnodiging` (Home en /contact) staat erboven
 * de slotzin letter voor letter (letter-reveal) met de weg naar contact, LinkedIn en de checklist.
 * `data-dock-verberg`: de sectie-dock heeft hier niets toe te voegen.
 */
export function Voet({ uitnodiging = false }: { uitnodiging?: boolean }) {
  const [eerste, tweede] = voet.kop.split('? ')
  return (
    <footer className={uitnodiging ? 'voet' : 'voet voet--kort'} data-dock-verberg="">
      <div className="container-site">
        {uitnodiging ? (<>
        <LetterReveal as="h2" className="voet-kop" lineSelector="[data-lr-line]" duration={0.8} stagger={0.035} lineGap={0.15}>
          <span data-lr-line="">{eerste}?</span>
          <span data-lr-line="secondary">{tweede}</span>
        </LetterReveal>
        <div className="voet-acties">
          <a className="knop" href="/contact">{voet.bericht}</a>
          <a className="knop knop--rand" href={linkedin} target="_blank" rel="noopener noreferrer">
            {voet.linkedin} <span aria-hidden="true">↗</span>
          </a>
          <ChecklistKnop className="knop knop--rand">{kop.checklist}</ChecklistKnop>
        </div>
        </>) : null}
        <div className="voet-onder">
          <p className="voet-merk">
            {kop.merk} <span className="x" aria-hidden="true">×</span> <span className="voet-sub">{kop.ondertitel}</span>
          </p>
          <nav aria-label="Voet">
            <ul>
              {kop.links.map((l) => (
                <li key={l.href}><a href={l.href}>{l.label}</a></li>
              ))}
              <li><a href="/privacy">{voet.privacy}</a></li>
              {uitnodiging ? null : <li><ChecklistKnop>{kop.checklist}</ChecklistKnop></li>}
            </ul>
          </nav>
          <div className="voet-rechts">
            <WijzigToestemmingKnop />
            <a href="#top">{voet.naarBoven}</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
