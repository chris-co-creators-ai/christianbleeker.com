import { Verbindingshub } from '@/features/verbindingshub/Verbindingshub'
import { teamHub as t } from '@/content/v3x'
import './v3x.css'

const Foto = ({ bestand }: { bestand: string }) => (
  <picture>
    <source srcSet={`/beeld/${bestand}.avif`} type="image/avif" />
    <img src={`/beeld/${bestand}.webp`} alt="" width={52} height={52} loading="lazy" decoding="async" />
  </picture>
)
const Icoon = ({ d }: { d: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)

const BRONNEN = t.leden.map((l) => ({ naam: l.naam, icoon: <Foto bestand={l.foto} /> }))
const DOELEN = [
  { naam: 'Dicteren.ai', icoon: <Icoon d="M12 3.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3" /> },
  { naam: 'Co-Creators.ai', icoon: <Icoon d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 19c.5-3 2.5-5 5-5s4.5 2 5 5M16.5 4.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z" /> },
  { naam: 'Seveke Creative', icoon: <Icoon d="M4 5.5h16v13H4zM4 9h16M8 13h5M8 15.5h8" /> },
]
const HUB = { naam: t.hub, icoon: <span aria-hidden="true">×</span> }

/** Team op /about: de teamleden, verbonden met waar ze aan werken (verbindingshub). */
export function TeamHub() {
  return (
    <div className="v3x team-hub">
      <Verbindingshub bronnen={BRONNEN} doelen={DOELEN} hub={HUB} bronLabel={t.bronLabel} doelLabel={t.doelLabel} label={t.label} via={t.via} met={t.met} />
    </div>
  )
}
