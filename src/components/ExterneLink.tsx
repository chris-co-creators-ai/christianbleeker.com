import { casePagina } from '@/content/teksten'
import type { Case } from '@/content/cases'

/** Link naar de echte site van een case, in een nieuw tabblad. Zonder `url` verschijnt er niets. */
export function ExterneLink({ c, className, children = casePagina.bekijk }: { c: Pick<Case, 'naam' | 'url'>; className?: string; children?: React.ReactNode }) {
  if (!c.url) return null
  return (
    <a className={className} href={c.url} target="_blank" rel="noopener noreferrer" aria-label={casePagina.bekijkAlt(c.naam)}>
      {children}
    </a>
  )
}
