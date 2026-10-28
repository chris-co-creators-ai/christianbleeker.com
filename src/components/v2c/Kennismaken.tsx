import { AgendaFacade } from '@/features/agenda-facade/AgendaFacade'
import { ChecklistKnop } from '@/components/ChecklistKnop'
import { contact, kop } from '@/content/teksten'
import './kennismaken.css'

/**
 * Twee andere wegen dan het formulier, naast elkaar: een kennismaking plannen (agenda-facade: de agenda laadt
 * pas na "Kies een moment", tot dan gaat er niets naar cal.com) en de website-checklist prompt.
 */
export function Kennismaken() {
  const a = contact.agenda
  return (
    <div className="kennismaken">
      <AgendaFacade className="kennismaken__agenda">
        <h2 className="kennismaken__kop">{a.kop}</h2>
        <div className="af" data-agenda-facade="" data-dienst="cal" data-titel={a.titel}>
          <div className="af__kaart">
            <div className="af__wie">
              { }
              <img className="af__avatar" src="/beeld/chris-duimen-540.webp" alt="" width={52} height={52} loading="lazy" />
              <div><p className="af__naam">Chris Bleeker</p><p className="af__rol">{a.rol}</p></div>
            </div>
            <ul className="af__feiten"><li className="af__feit">{a.duur}</li><li className="af__feit">{a.waar}</li></ul>
            <p className="af__tekst">{a.tekst}</p>
            <div className="af__acties">
              <a className="af__link" data-af-fallback="" href={a.url} target="_blank" rel="noopener noreferrer">{a.link}</a>
            </div>
          </div>
        </div>
      </AgendaFacade>
      <div className="kennismaken__checklist">
        <h2 className="kennismaken__kop">{contact.checklist.kop}</h2>
        <p>{contact.checklist.tekst}</p>
        <ChecklistKnop className="knop knop--mint">{kop.checklist}</ChecklistKnop>
      </div>
    </div>
  )
}
