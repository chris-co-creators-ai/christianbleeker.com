import { kop } from '@/content/teksten'
import { PillNav } from '@/features/pill-nav/PillNav'
import { ImageMenu } from '@/features/image-menu/ImageMenu'
import { ChecklistKnop } from '@/components/ChecklistKnop'

/** Per menu-item een eigen foto in het schermvullende menu (image-menu, mobiel en tablet). */
const MENUBEELD: Record<string, { beeld: string; alt: string }> = {
  '/': { beeld: '/beeld/tedx-768.webp', alt: 'Chris op het TEDx-podium' },
  '/about': { beeld: '/beeld/chris-duimen-540.webp', alt: 'Chris met twee duimen omhoog' },
  '/work': { beeld: '/beeld/radstok-interim-omslag-480.webp', alt: 'De website van Radstok Interim' },
  '/ai': { beeld: '/beeld/team-chris.webp', alt: 'Chris met de microfoon van Dicteren.ai' },
  '/contact': { beeld: '/beeld/team-brian.webp', alt: 'Brian' },
}

/**
 * Kop op elke pagina. Vanaf 960 px de zwevende pil (pill-nav) met de checklist-knop; daaronder
 * het merk plus de knop "Menu" die het schermvullende beeldmenu opent (image-menu).
 */
export function Kop({ pad }: { pad: string }) {
  const actief = (href: string) => (href === '/' ? pad === '/' : pad.startsWith(href))
  return (
    <header className="kop-site" id="top">
      <div className="kop-desktop">
        <PillNav links={kop.links.map((l) => ({ ...l, active: actief(l.href) }))} brand={kop.merk} brandHref="/" className="pt-share" position="top" hideOnScroll={false} hideThreshold={0}>
          <a className="pn__brand" href="/">{kop.merk}</a>
          <ul className="pn__list" data-pn-list>
            {kop.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} aria-current={actief(l.href) ? 'page' : undefined}>{l.label}</a>
              </li>
            ))}
          </ul>
          <ChecklistKnop className="pn__cta">{kop.checklist}</ChecklistKnop>
        </PillNav>
      </div>
      <div className="kop-mobiel container-site">
        <a className="kop-merk" href="/">
          <span>{kop.merk}</span>{" "}
          <small aria-hidden="true">{kop.ondertitel}</small>
        </a>
        <ImageMenu
          links={kop.links.map((l) => ({
            href: l.href,
            label: l.label,
            image: MENUBEELD[l.href].beeld,
            imageAlt: MENUBEELD[l.href].alt,
            color: '#17110f',
            active: actief(l.href),
          }))}
        />
      </div>
    </header>
  )
}
