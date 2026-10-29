import type { ReactNode } from 'react'
import { AppTourVenster, type AppTourApp } from '@/features/app-tour-venster/AppTourVenster'
import { EigenNaamPreview } from '@/features/eigen-naam-preview/EigenNaamPreview'
import { LevendeKaarten } from '@/features/levende-kaarten/LevendeKaarten'
import { Blokgrafiek } from '@/features/blokgrafiek/Blokgrafiek'
import { Besparingscalculator } from '@/features/besparingscalculator/Besparingscalculator'
import { euro } from '@/content/prijzen'
import { interneApps as t, appPakketten, rekenConfig } from '@/content/v3x'
import './v3x.css'

/** Lijnicoon 24×24 in de stijl van het app-tour-venster. */
const I = ({ d, maat = 16 }: { d: string; maat?: number }) => (
  <svg className="atv-i" width={maat} height={maat} viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>
)
const P = {
  klok: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4.5l3 2',
  agenda: 'M5.5 5.5h13a1.5 1.5 0 0 1 1.5 1.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18V7a1.5 1.5 0 0 1 1.5-1.5zM8 3.5v4M16 3.5v4M4 10h16',
  map: 'M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z',
  boek: 'M5 4.5h9.5a3 3 0 0 1 3 3v12h-9.5a3 3 0 0 1-3-3zM5 16.5a3 3 0 0 1 3-3h9.5',
  huis: 'M4.5 11 12 5l7.5 6v8.5h-15zM10 19.5v-5h4v5',
  plus: 'M12 5.5v13M5.5 12h13',
  zoek: 'M11 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM19.5 19.5l-4.2-4.2',
  vink: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM8.5 12.3l2.3 2.2 4.7-5',
  oog: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  dicht: 'M4 4l16 16M10 5.7a9 9 0 0 1 2-.2c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.9 3.6M6.4 7.3A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4-.9',
  ster: 'm12 4.5 2.3 4.8 5.2.7-3.8 3.6.9 5.2-4.6-2.5-4.6 2.5.9-5.2L4.5 10l5.2-.7z',
  pijl: 'M5 12h13M13 6.5l5.5 5.5-5.5 5.5',
  sparkle: 'M12 3.5l1.8 5 5 1.8-5 1.8-1.8 5-1.8-5-5-1.8 5-1.8zM18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z',
}

const Werkruimte = () => (
  <div className="atv-werkruimte"><span className="atv-tegel" data-eigen-naam="initiaal">J</span><strong data-eigen-naam="werkruimte">{t.tour.werkruimte}</strong></div>
)
const Gebruiker = () => <div className="atv-gebruiker"><span className="atv-avatar">SB</span>Sanne Bakker</div>
const Nav = ({ items }: { items: [string, string, boolean?][] }) => (
  <div className="atv-nav">{items.map(([d, naam, aan]) => <span key={naam} className={`atv-nav__item${aan ? ' is-aan' : ''}`}><I d={d} />{naam}</span>)}</div>
)

/** Vier verzonnen apps voor binnen een bedrijf (alles aria-hidden; per app een zin voor schermlezers). */
const APPS: AppTourApp[] = [
  {
    label: 'Urenregistratie',
    domein: 'uren.{slug}.nl',
    icoon: <I d={P.klok} maat={18} />,
    beschrijving: 'Voorbeeld van een urenregistratie: week 45, 32,5 van 40 uur geschreven, verdeeld over vier projecten. De balken per project lopen vol.',
    scherm: (
      <div className="atv-app">
        <aside className="atv-zij">
          <Werkruimte />
          <div className="atv-zoek"><I d={P.zoek} maat={14} />Zoeken<kbd>⌘K</kbd></div>
          <Nav items={[[P.huis, 'Start'], [P.klok, 'Mijn uren', true], [P.map, 'Projecten'], [P.agenda, 'Rapport']]} />
          <p className="atv-zijlabel">Projecten</p>
          <div className="atv-nav">
            <span className="atv-nav__item"><i className="atv-stip" />Keuken Hoorn</span>
            <span className="atv-nav__item"><i className="atv-stip" style={{ ['--c' as string]: 'var(--sky)' }} />Badkamer Enkhuizen</span>
            <span className="atv-nav__item"><i className="atv-stip" style={{ ['--c' as string]: 'var(--ink-muted)' }} />Onderhoud</span>
          </div>
          <Gebruiker />
        </aside>
        <div className="atv-hoofd">
          <div className="atv-balk">
            <div><h3 className="atv-titel">Week 45</h3><p className="atv-sub">32,5 van 40 uur · nog 7,5 te schrijven</p></div>
            <span className="atv-knop"><I d={P.plus} /><span>Uren schrijven</span></span>
          </div>
          <div className="atv-inhoud">
            <div className="atv-rij2">
              <div className="atv-vak atv-in" style={{ ['--i' as string]: 0 }}>
                <div className="atv-vak__kop"><span>Per project</span><span>Uur</span></div>
                <div className="atv-kaart atv-balken">
                  <div className="atv-balk-rij" style={{ ['--w' as string]: 0.78, ['--i' as string]: 0 }}><i /><strong>Keuken Hoorn</strong><span>14,5</span></div>
                  <div className="atv-balk-rij" style={{ ['--w' as string]: 0.56, ['--i' as string]: 1 }}><i /><strong>Badkamer Enkhuizen</strong><span>9</span></div>
                  <div className="atv-balk-rij" style={{ ['--w' as string]: 0.31, ['--i' as string]: 2 }}><i /><strong>Offertes</strong><span>5</span></div>
                  <div className="atv-balk-rij" style={{ ['--w' as string]: 0.25, ['--i' as string]: 3 }}><i /><strong>Overleg</strong><span>4</span></div>
                </div>
              </div>
              <div className="atv-vak atv-in" style={{ ['--i' as string]: 1 }}>
                <div className="atv-vak__kop"><span>Vandaag</span><span>Uur</span></div>
                <div className="atv-kaart atv-lijst">
                  <div className="atv-lijst__rij"><strong>Keuken Hoorn · plaatsen</strong><span>4,5</span></div>
                  <div className="atv-lijst__rij"><strong>Offerte Fam. De Wit</strong><span>1</span></div>
                  <div className="atv-lijst__rij"><strong>Overleg planning</strong><span>0,5</span></div>
                  <div className="atv-lijst__rij"><strong>Reistijd</strong><span>1</span></div>
                </div>
              </div>
            </div>
            <div className="atv-vak atv-in atv-alleen-breed" style={{ ['--i' as string]: 2 }}>
              <div className="atv-vak__kop"><span>Het team deze week</span><span>Uur</span></div>
              <div className="atv-kaart atv-lijst">
                <div className="atv-lijst__rij"><strong>Ahmed Yilmaz</strong><span>38</span></div>
                <div className="atv-lijst__rij"><strong>Lotte de Vries</strong><span>24</span></div>
                <div className="atv-lijst__rij"><strong>Sanne Bakker</strong><span>32,5</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    label: 'Verlof en rooster',
    domein: 'rooster.{slug}.nl',
    icoon: <I d={P.agenda} maat={18} />,
    beschrijving: 'Voorbeeld van verlof en rooster: drie aanvragen in drie kolommen. De aanvraag van Lotte voor 23 tot 27 december schuift van aangevraagd naar goedgekeurd.',
    scherm: (
      <div className="atv-app">
        <aside className="atv-zij">
          <Werkruimte />
          <Nav items={[[P.huis, 'Start'], [P.agenda, 'Rooster'], [P.ster, 'Verlof', true]]} />
          <p className="atv-zijlabel">Saldo</p>
          <div className="atv-nav">
            <span className="atv-nav__item"><i className="atv-stip" />Nog 14 dagen</span>
            <span className="atv-nav__item"><i className="atv-stip" style={{ ['--c' as string]: 'var(--sky)' }} />3 dagen gepland</span>
          </div>
          <Gebruiker />
        </aside>
        <div className="atv-hoofd">
          <div className="atv-balk">
            <div><h3 className="atv-titel">Verlof december</h3><p className="atv-sub">5 aanvragen · 2 wachten op jou</p></div>
            <span className="atv-knop"><I d={P.plus} /><span>Verlof aanvragen</span></span>
          </div>
          <div className="atv-bord">
            <div className="atv-kolom atv-in" style={{ ['--i' as string]: 0 }} data-atv-kolom="aangevraagd">
              <div className="atv-kolom__kop"><i className="atv-stip" style={{ ['--c' as string]: 'var(--ink-muted)' }} />Aangevraagd<span data-atv-aantal="">2</span></div>
              <div className="atv-kolom__lijf" data-atv-lijf="">
                <div className="atv-taak" data-atv-kaart="" data-atv-verhuis="klaar" data-atv-na="1300"><div className="atv-taak__top"><span className="atv-mono">23–27 dec</span><svg className="atv-i atv-taak__vink" viewBox="0 0 24 24" aria-hidden="true"><path d={P.vink} /></svg></div><strong>Lotte de Vries · kerst</strong><div className="atv-taak__meta"><span className="atv-chip">Verlof</span>5 dagen<span className="atv-avatar atv-avatar--klein">LV</span></div></div>
                <div className="atv-taak" data-atv-kaart=""><div className="atv-taak__top"><span className="atv-mono">2 jan</span></div><strong>Ahmed Yilmaz · tandarts</strong><div className="atv-taak__meta"><span className="atv-chip">Halve dag</span>4 uur<span className="atv-avatar atv-avatar--klein">AY</span></div></div>
              </div>
            </div>
            <div className="atv-kolom atv-in atv-alleen-breed" style={{ ['--i' as string]: 1 }} data-atv-kolom="overleg">
              <div className="atv-kolom__kop"><i className="atv-stip" />In overleg<span data-atv-aantal="">1</span></div>
              <div className="atv-kolom__lijf" data-atv-lijf="">
                <div className="atv-taak" data-atv-kaart=""><div className="atv-taak__top"><span className="atv-mono">30–31 dec</span></div><strong>Joris Kok · ruilen met Sanne</strong><div className="atv-taak__meta"><span className="atv-chip">Ruil</span>2 dagen<span className="atv-avatar atv-avatar--klein">JK</span></div></div>
              </div>
            </div>
            <div className="atv-kolom atv-in" style={{ ['--i' as string]: 2 }} data-atv-kolom="klaar">
              <div className="atv-kolom__kop"><i className="atv-stip" style={{ ['--c' as string]: 'var(--success)' }} />Goedgekeurd<span data-atv-aantal="">2</span></div>
              <div className="atv-kolom__lijf" data-atv-lijf="">
                <div className="atv-taak" data-atv-kaart="" data-atv-klaar=""><div className="atv-taak__top"><span className="atv-mono">16–20 dec</span><svg className="atv-i atv-taak__vink" viewBox="0 0 24 24" aria-hidden="true"><path d={P.vink} /></svg></div><strong>Sanne Bakker · wintersport</strong><div className="atv-taak__meta"><span className="atv-chip">Verlof</span>5 dagen<span className="atv-avatar atv-avatar--klein">SB</span></div></div>
                <div className="atv-taak" data-atv-kaart="" data-atv-klaar=""><div className="atv-taak__top"><span className="atv-mono">12 dec</span><svg className="atv-i atv-taak__vink" viewBox="0 0 24 24" aria-hidden="true"><path d={P.vink} /></svg></div><strong>Ahmed Yilmaz · cursus</strong><div className="atv-taak__meta"><span className="atv-chip">Opleiding</span>1 dag<span className="atv-avatar atv-avatar--klein">AY</span></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    label: 'Klantdossier',
    domein: 'klanten.{slug}.nl',
    icoon: <I d={P.map} maat={18} />,
    beschrijving: 'Voorbeeld van een klantdossier: zes klanten met hun plaats en status. De toegangscode van één klant wordt zichtbaar voor wie daar recht op heeft.',
    scherm: (
      <div className="atv-app">
        <aside className="atv-zij">
          <Werkruimte />
          <Nav items={[[P.map, 'Alle klanten', true], [P.ster, 'Favorieten'], [P.boek, 'Notities']]} />
          <p className="atv-zijlabel">Status</p>
          <div className="atv-nav">
            <span className="atv-nav__item"><i className="atv-stip" style={{ ['--c' as string]: 'var(--sky)' }} />Offerte</span>
            <span className="atv-nav__item"><i className="atv-stip" />In uitvoering</span>
            <span className="atv-nav__item"><i className="atv-stip" style={{ ['--c' as string]: 'var(--ink-muted)' }} />Onderhoud</span>
          </div>
          <Gebruiker />
        </aside>
        <div className="atv-hoofd">
          <div className="atv-balk">
            <div><h3 className="atv-titel">Alle klanten</h3><p className="atv-sub">148 klanten · 12 met een open offerte</p></div>
            <div className="atv-acties"><span className="atv-zoekpil atv-alleen-breed"><I d={P.zoek} />Zoek een klant</span><span className="atv-knop"><I d={P.plus} /><span>Nieuwe klant</span></span></div>
          </div>
          <div className="atv-vak atv-kluis atv-in" style={{ ['--i' as string]: 0 }}>
            <div className="atv-kluis__kop"><span>Klant</span><span>Toegangscode</span></div>
            {[
              ['W', 'Fam. De Wit', 'Hoorn · keuken', 'In uitvoering', false],
              ['B', 'Bakkerij Van Dam', 'Enkhuizen · onderhoud', 'Onderhoud', false],
              ['J', 'Fam. Jansen', 'Medemblik · badkamer', 'Offerte', true],
              ['K', 'Kinderopvang Het Nest', 'Schagen · cv-ketel', 'Onderhoud', false],
              ['M', 'Mevr. Meijer', 'Hoorn · dakkapel', 'Offerte', false],
              ['T', 'Tandartspraktijk Zuid', 'Enkhuizen · airco', 'In uitvoering', false],
            ].map(([letter, naam, waar, status, open]) => (
              <div key={naam as string} className="atv-item" {...(open ? { 'data-atv-onthul': '', 'data-atv-na': '1100' } : {})}>
                <span className="atv-item__tegel">{letter as string}</span>
                <span className="atv-item__naam"><strong>{naam as string}</strong><span>{waar as string}</span></span>
                <span className="atv-geheim"><span className="atv-geheim__punten">••••</span>{open ? <span className="atv-geheim__echt">4471</span> : null}</span>
                <span className="atv-chip atv-chip--goed">{status as string}</span>
                <span className="atv-item__acties">{open ? <><svg className="atv-i atv-oog-dicht" viewBox="0 0 24 24" aria-hidden="true"><path d={P.dicht} /></svg><svg className="atv-i atv-oog-open" viewBox="0 0 24 24" aria-hidden="true"><path d={P.oog} /></svg></> : <I d={P.dicht} />}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    label: 'Kennisbank met AI',
    domein: 'kennis.{slug}.nl',
    icoon: <I d={P.boek} maat={18} />,
    beschrijving: 'Voorbeeld van een kennisbank met AI-zoeken: Sanne vraagt hoe ze verlof aanvraagt voor de kerst. De assistent zoekt en antwoordt met de bron uit het personeelshandboek.',
    scherm: (
      <div className="atv-app">
        <aside className="atv-zij atv-zij--nacht">
          <Werkruimte />
          <p className="atv-zijlabel">Bronnen</p>
          <div className="atv-nav">
            <span className="atv-nav__item"><span className="atv-hekje">#</span>personeelshandboek</span>
            <span className="atv-nav__item"><span className="atv-hekje">#</span>werkinstructies</span>
            <span className="atv-nav__item"><span className="atv-hekje">#</span>veiligheid</span>
            <span className="atv-nav__item"><span className="atv-hekje">#</span>klantafspraken</span>
          </div>
          <Gebruiker />
        </aside>
        <div className="atv-hoofd atv-hoofd--vast">
          <div className="atv-balk">
            <div><h3 className="atv-titel">Vraag het de kennisbank</h3><p className="atv-sub">212 pagina’s · alleen jullie eigen documenten</p></div>
            <span className="atv-zoekpil atv-alleen-breed"><I d={P.sparkle} />AI-zoeken</span>
          </div>
          <div className="atv-chat">
            <div className="atv-chat__berichten">
              <div className="atv-chat__intro atv-alleen-breed"><strong>Zoek in gewone taal</strong><p>De assistent antwoordt alleen uit de documenten van <span data-eigen-naam="werkruimte">{t.tour.werkruimte}</span>, met de bron erbij.</p></div>
              <div className="atv-dag">Vandaag</div>
              <div className="atv-bericht atv-in atv-alleen-breed" style={{ ['--i' as string]: 0 }}><span className="atv-avatar">AY</span><div><div className="atv-bericht__kop"><strong>Ahmed Yilmaz</strong><span>08:12</span></div><p>Welk drukvat hoort bij de ketel van Het Nest?</p></div></div>
              <div className="atv-bericht atv-in" style={{ ['--i' as string]: 1 }}><span className="atv-avatar">AI</span><div><div className="atv-bericht__kop"><strong>Assistent</strong><span>08:12</span></div><p>Een vat van 18 liter. Bron: werkinstructies, cv-ketels, p. 3.</p></div></div>
              <div className="atv-bericht atv-in" style={{ ['--i' as string]: 2 }}><span className="atv-avatar">SB</span><div><div className="atv-bericht__kop"><strong>Sanne Bakker</strong><span>09:40</span></div><p>Hoe vraag ik verlof aan voor de kerst?</p></div></div>
              <div className="atv-bericht" data-atv-nieuw="" data-atv-na="2300" hidden><span className="atv-avatar">AI</span><div><div className="atv-bericht__kop"><strong>Assistent</strong><span>09:40</span></div><p>Via Verlof aanvragen, uiterlijk 1 december. Bron: personeelshandboek, p. 4.</p><span className="atv-chip atv-reactie">Personeelshandboek</span></div></div>
            </div>
            <div className="atv-typt" data-atv-typt=""><span className="atv-puntjes"><i /><i /><i /></span>Assistent zoekt…</div>
            <div className="atv-schrijf">Stel een vraag<I d={P.pijl} /></div>
          </div>
        </div>
      </div>
    ),
  },
]

/** Kaart van levende-kaarten met één visual (markup volgens het contract in de README). */
function Kaart({ visual, tint, vlak, label, kop, tekst, naam, domein, children }: { visual: string; tint?: string; vlak?: string; label: string; kop: string; tekst: string; naam: string; domein: string; children: ReactNode }) {
  return (
    <article className="lk-kaart">
      <div className="lk-media">
        <div className="lk-visual" data-lk-visual={visual} data-lk-tint={tint} data-lk-vlak={vlak} aria-hidden="true">{children}</div>
      </div>
      <div className="lk-tekst">
        <p className="lk-label">{label}</p>
        <h3>{kop}</h3>
        <p className="lk-body">{tekst}</p>
        <div className="lk-meta"><strong>{naam}</strong><code data-eigen-naam="domein" data-eigen-naam-sjabloon={domein.replace('jouwbedrijf', '{slug}')}>{domein}</code></div>
      </div>
    </article>
  )
}
const Doc = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M4.5 2.5h5l2.5 2.5v8.5h-7.5z" /><path d="M9.5 2.5V5H12M6.5 8h3.5M6.5 10.5h3.5" /></svg>
const Klok = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="5.5" /><path d="M8 5v3.2l2 1.3" /></svg>
const Bord = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2.5" y="2.5" width="11" height="11" rx="2" /><path d="M6.5 2.5v11M10 2.5v7" /></svg>
const Goed = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg>
const Kal = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2.5" y="3.5" width="11" height="10" rx="1.5" /><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" /></svg>
const Vraag = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M3 3.5h10v7H7.5L4.5 13v-2.5H3z" /></svg>

const STAPEL: [string, string, string, string, string, boolean][] = [
  ['Oplevering keuken Hoorn', '12 van 14 punten', 'AY', 'Ahmed', 'nu', false],
  ['Keuring cv Het Nest', 'klaar · 6 foto’s', 'LV', 'Lotte', '6m', true],
  ['Schouw dakkapel Meijer', 'nieuwe lijst', 'JK', 'Joris', '12m', false],
  ['Badkamer Jansen', 'tegels → kitten', 'SB', 'Sanne', '18m', false],
  ['Airco Tandarts Zuid', 'filter → test', 'AY', 'Ahmed', '25m', false],
  ['Bus 2 · maandcheck', 'nieuwe lijst', 'LV', 'Lotte', '31m', false],
  ['Lekdetectie Van Dam', 'klaar · 3 foto’s', 'JK', 'Joris', '40m', true],
]

export function InterneApps() {
  const populair = appPakketten.findIndex((p) => p.populair)
  const weken = (tijd: string) => Math.max(...(tijd.match(/\d+/g) ?? ['1']).map(Number))
  return (
    <section id={t.id} className="sectie container-site v3x ia" aria-labelledby={`${t.id}-kop`}>
      <div className="sectie-kop wp-groep-kop">
        <p className="kicker">{t.nr} <span aria-hidden="true">—</span> {t.naam}</p>
        <h2 id={`${t.id}-kop`}>{t.kop}</h2>
        <p className="sectie-tekst">{t.tekst}</p>
      </div>
      <span className="demo-label">{t.label}</span>
      <AppTourVenster apps={APPS} slug={t.tour.slug} label={t.tour.label} interval={6} className="ia-tour" />
      <EigenNaamPreview label={t.naamVeld.label} placeholder={t.naamVeld.placeholder} uitleg={t.naamVeld.uitleg} doel=".ia" sleutel="cb-eigen-naam" />

      <div className="v3x-sub ia-kaarten">
        <h3>{t.kaarten.kop}</h3>
        <p>{t.kaarten.tekst}</p>
        <LevendeKaarten>
          <Kaart visual="balken" vlak="rustig" label="Urenregistratie" kop="Uren schrijven in tien seconden" tekst="Per project en per klant, op je telefoon op de bouwplaats. Het overzicht voor de factuur staat er meteen." naam="Uren" domein="uren.jouwbedrijf.nl">
            <div className="lk-binnen lk-balken">
              <ul>
                {[['Keuken Hoorn', '14,5'], ['Badkamer Enkhuizen', '9'], ['Onderhoud', '5']].map(([n, u]) => (
                  <li key={n} className="lk-balk"><span className="lk-icoon lk-icoon--s"><Klok /></span><strong>{n}</strong><span className="lk-balk__baan"><i /></span><em>{u}</em></li>
                ))}
              </ul>
              <p>Week 45, in uren per project</p>
            </div>
          </Kaart>
          <Kaart visual="agenda" label="Verlof en rooster" kop="Wie werkt er wanneer?" tekst="Verlof aanvragen en goedkeuren op één plek, met het rooster ernaast. Geen gedeeld Excelbestand meer." naam="Rooster" domein="rooster.jouwbedrijf.nl">
            <div className="lk-binnen lk-agenda">
              <ul className="lk-slots">
                {[['ma', '07:30'], ['di', '07:30'], ['wo', '12:00'], ['do', '07:30']].map(([d, tijd]) => <li key={d}><Kal /><strong>{d}</strong><time>{tijd}</time></li>)}
              </ul>
              <p className="lk-pil"><span className="lk-pil__ok"><Goed /></span>4 diensten ingepland <code>rooster</code></p>
            </div>
          </Kaart>
          <Kaart visual="reis" vlak="rustig" label="Klantdossier" kop="De hele klant op één scherm" tekst="Offertes, afspraken, foto’s en notities per klant, zodat iedereen weet wat er speelt." naam="Klanten" domein="klanten.jouwbedrijf.nl">
            <div className="lk-binnen lk-reis">
              <span className="lk-reis__lijn" />
              <ol className="lk-reis__rijen">
                {[['Offerte verstuurd', 'Fam. Jansen', '09:12'], ['Akkoord getekend', 'Fam. Jansen', '11:40'], ['Planning gemaakt', 'week 47', '11:52'], ['Foto’s toegevoegd', '6 foto’s', '15:05']].map(([kop, sub, tijd], i) => (
                  <li key={kop}>{i === 0 ? <i className="lk-avatar lk-avatar--l">SB</i> : <i className="lk-punt" />}<span className="lk-pagina"><span className="lk-icoon lk-icoon--s"><Doc /></span><span className="lk-trunc"><strong>{kop}</strong><code>{sub}</code></span><time>{tijd}</time></span></li>
                ))}
              </ol>
            </div>
          </Kaart>
          <Kaart visual="spotlight" vlak="rustig" label="Kennisbank met AI" kop="Vraag het de kennisbank" tekst="Je team zoekt in gewone taal in jullie eigen handboeken en instructies, met de bron bij elk antwoord." naam="Kennis" domein="kennis.jouwbedrijf.nl">
            <div className="lk-binnen lk-spot">
              <ul className="lk-spot__rijen">
                {[['Verlof voor de kerst?', 'handboek p. 4', '1'], ['Drukvat bij ketel?', 'instructies p. 3', '1'], ['Sleutel bus 2?', 'afspraken', '2']].map(([v, bron, n]) => (
                  <li key={v}><span className="lk-licht" /><span className="lk-id"><span className="lk-icoon"><Vraag /></span><span className="lk-trunc"><strong>{v}</strong><code>{bron}</code></span></span><span className="lk-metriek"><strong>{n}</strong><span>bron</span></span><span className="lk-metriek"><span>AI</span><span>zoekt</span></span></li>
                ))}
              </ul>
            </div>
          </Kaart>
          <Kaart visual="stapel" label="Checklists" kop="Elke klus volgens dezelfde lijst" tekst="Opleveren, keuren of schouwen met een vaste checklist en foto’s erbij, ook zonder bereik." naam="Checklists" domein="lijsten.jouwbedrijf.nl">
            <div className="lk-binnen lk-midden">
              <ul className="lk-stapel">
                {STAPEL.map(([kop, sub, init, naam, tijd, klaar]) => (
                  <li key={kop}><span className="lk-id"><span className={`lk-icoon${klaar ? ' lk-icoon--goed' : ''}`}>{klaar ? <Goed /> : <Bord />}</span><span className="lk-trunc"><strong>{kop}</strong><code>{sub}</code></span></span><span className="lk-persoon"><i className="lk-avatar">{init}</i><span>{naam}</span></span><time>{tijd}</time></li>
                ))}
              </ul>
            </div>
          </Kaart>
          <Kaart visual="handtekening" tint="lucht" label="Werkbonnen" kop="Laat de klant meteen tekenen" tekst="Een werkbon op de tablet, getekend bij de klant en meteen in het dossier. Geen papier meer in de bus." naam="Werkbon" domein="werkbon.jouwbedrijf.nl">
            <div className="lk-binnen lk-midden">
              <div className="lk-doc">
                <strong>Werkbon · Fam. De Wit</strong>
                <span className="lk-doc__meta">4,5 uur · wacht op handtekening</span>
                <span className="lk-doc__regels"><i /><i /><i /></span>
                <span className="lk-doc__lijn"><svg viewBox="0 0 150 44"><path pathLength={1} d="M5 31c4-14 11-24 16-19 4 4-4 20-10 22-5 2 4-10 13-11 7-1 7 9 13 8 6-1 7-14 13-13 5 1 0 13 6 13 7 0 9-12 16-11 6 1 1 12 8 12 9 0 14-10 21-9 6 1 3 9 10 8 9-1 17-5 27-4" /></svg></span>
                <span className="lk-doc__badge"><Goed />Getekend</span>
              </div>
            </div>
          </Kaart>
        </LevendeKaarten>
      </div>

      <div className="v3x-sub ia-varianten">
        <div>
          <h3>{t.varianten.kop}</h3>
          <p>{t.varianten.tekst} {t.varianten.blokUitleg}</p>
          <ul>
            {appPakketten.map((p) => <li key={p.id}><strong>{p.naam}</strong> · vanaf {euro(p.prijs)}<span>{p.oplevert[0]}</span></li>)}
          </ul>
          <p><a className="link" href="/contact#dienst-apps">{t.varianten.link}</a></p>
        </div>
        <Blokgrafiek gekozen={populair} legenda={{ gekozen: 'Meest gekozen', overig: 'Andere varianten' }}>
          <div className="bgf__bron">
            <table className="bgf__tabel">
              <caption>{t.varianten.caption}</caption>
              <thead><tr><th scope="col">Variant</th><th scope="col" data-grafiek="sub">Bouwtijd</th><th scope="col" data-grafiek="waarde">Vanaf</th></tr></thead>
              <tbody>
                {appPakketten.map((p, i) => (
                  <tr key={p.id} data-blokken={weken(p.tijd)} {...(i === populair ? { 'data-huidig': '' } : {})}><th scope="row">{p.naam}</th><td>{p.tijd}</td><td>{euro(p.prijs)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Blokgrafiek>
      </div>

      <div className="v3x-sub ia-rekenen">
        <h3>{t.rekenen.kop}</h3>
        <p>{t.rekenen.tekst}</p>
        <Besparingscalculator config={rekenConfig}>
          <p>{t.rekenen.terugval} <a className="link" href="/contact?dienst=apps&pakket=proces#intake">{t.rekenen.terugvalLink}</a></p>
        </Besparingscalculator>
      </div>
    </section>
  )
}
