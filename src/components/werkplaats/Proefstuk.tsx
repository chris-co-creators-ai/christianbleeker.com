import type { ReactNode } from 'react'
import { werkplaats, type Proefstuk as Stuk } from '@/content/werkplaats'
import { demoUrl } from '@/content/demos'

/**
 * Eén proefstuk in de Werkplaats: links voor wie het is (label "Voorbeeld", het vak, één zin, eventueel de
 * ontwerp-demo die erbij past), rechts het werkende onderdeel op de werkbank. `breed`: de werkbank onder de
 * tekst, over de volle breedte (de werkgebied-kaart heeft zelf twee kolommen).
 */
export function Proefstuk({ stuk, children, breed = false, kaal = false }: { stuk: Stuk; children: ReactNode; breed?: boolean; kaal?: boolean }) {
  return (
    <article className={`proefstuk${breed ? ' proefstuk--breed' : ''}`} id={stuk.id} aria-labelledby={`${stuk.id}-kop`}>
      <div className="proefstuk-meta">
        <p className="demo-label">{werkplaats.label}</p>
        <h3 id={`${stuk.id}-kop`} className="proefstuk-kop">{stuk.voor}</h3>
        <p className="proefstuk-zin">{stuk.zin}</p>
        {stuk.demo ? (
          <a className="proefstuk-demo" href={demoUrl(stuk.demo)} target="_blank" rel="noopener noreferrer" aria-label={werkplaats.demoAria(stuk.demo)}>
            {werkplaats.demo(stuk.demo)} <span aria-hidden="true">↗</span>
          </a>
        ) : null}
      </div>
      <div className={kaal ? 'proefstuk-bank proefstuk-bank--kaal' : 'proefstuk-bank'}>{children}</div>
    </article>
  )
}
