/**
 * Deze site is alleen Nederlands (PRD §0.1-21): elke taal wijst naar dezelfde NL-bron. Komt er
 * later een taal bij, dan krijgt die hier een eigen `content/*.xx.ts` (zie site-basis).
 */
import { site, talen, type SiteInhoud } from '@/content/site'
import { ui, type UiInhoud } from '@/content/ui'
import type { Taal } from './i18n'

export { talen }

export function siteVoor(_taal: Taal): SiteInhoud {
  return site
}

export function uiVoor(_taal: Taal): UiInhoud {
  return ui
}
