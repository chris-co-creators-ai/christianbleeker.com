'use client'

import { useEffect } from 'react'
import { StappenPersoonlijk } from '@/features/stappen-persoonlijk/StappenPersoonlijk'
import { ChecklistKnop } from '@/components/ChecklistKnop'
import { contact, kop, linkedin, casePagina } from '@/content/teksten'
import './intake.css'

const t = contact.intake
const f = contact.formulier
const TERUGVAL = { bedrijf: 'je bedrijf' }
const FOUTLINK = { href: linkedin, tekst: contact.linkedin }
/** ?scan= (de AI-scan op /ai) en de berichttekst: platte tekst, begrensd. */
const MAX_SCAN = 1200

/**
 * Het contactformulier als intake in drie stappen (stappen-persoonlijk): wie je bent, waar je naartoe wilt,
 * wat je voor ogen hebt. Het post naar dezelfde /api/contact als altijd, met dezelfde velden naam, email en
 * bericht: de keuze uit stap 2, het bedrijf en een gekozen pakket gaan als regels bovenaan het bericht mee
 * (formdata-event), zodat de mailroute niet hoeft te veranderen. Zonder JS: één gewoon formulier.
 *
 * Voorinvullen vanuit de URL: ?dienst=&pakket= (knoppen bij de prijzen) kiest stap 2 voor, ?scan= (de AI-scan)
 * zet de uitslag als tekst in het bericht.
 */
export function Intake() {
  useEffect(() => {
    const form = document.getElementById('intake-formulier') as HTMLFormElement | null
    if (!form) return
    const q = new URLSearchParams(location.search)
    const kies = (waarde: string | null) => {
      const r = waarde ? form.querySelector<HTMLInputElement>(`input[name="doel"][value="${CSS.escape(waarde)}"]`) : null
      if (r) r.checked = true
    }
    kies(q.get('dienst'))
    const pakket = q.get('pakket')
    const pakketVeld = form.querySelector<HTMLInputElement>('input[name="pakket"]')
    if (pakket && pakketVeld) pakketVeld.value = pakket.slice(0, 60)
    const scan = q.get('scan')
    const bericht = form.querySelector<HTMLTextAreaElement>('textarea[name="bericht"]')
    if (scan && bericht) {
      bericht.value = scan.replace(/\s+\n/g, '\n').slice(0, MAX_SCAN) // .value: altijd platte tekst, nooit HTML
      kies('ai')
    }

    const opFormdata = (e: FormDataEvent) => {
      const d = e.formData
      const doel = t.doelen.find((x) => x.waarde === d.get('doel'))
      const regels = [
        doel ? `${t.vooraf.doel}: ${doel.titel}` : '',
        String(d.get('bedrijf') ?? '').trim() ? `${t.vooraf.bedrijf}: ${String(d.get('bedrijf')).trim()}` : '',
        String(d.get('pakket') ?? '').trim() ? `${t.vooraf.pakket}: ${String(d.get('pakket')).trim()}` : '',
      ].filter(Boolean)
      if (regels.length) d.set('bericht', `${regels.join('\n')}\n\n${String(d.get('bericht') ?? '')}`)
      const geopend = d.get('geopend')
      if (geopend) d.set('_geopend', String(geopend))
    }
    form.addEventListener('formdata', opFormdata)
    return () => form.removeEventListener('formdata', opFormdata)
  }, [])

  return (
    <div className="intake" id="intake">
      <StappenPersoonlijk id="intake-formulier" actie="/api/contact" className="formulier intake__form" terugval={TERUGVAL} foutTekst={f.mislukt} foutLink={FOUTLINK}>
        <fieldset data-sp-stap="">
          <legend><h2 data-sp-kop="">{t.stap1}</h2></legend>
          <div className="sp-rooster">
            <div className="sp-veld">
              <label htmlFor="veld-naam">{f.naam}</label>
              <input id="veld-naam" name="naam" required maxLength={200} autoComplete="name" data-sp-label="je naam" />
            </div>
            <div className="sp-veld">
              <label htmlFor="veld-email">{f.email}</label>
              <input id="veld-email" name="email" type="email" required maxLength={254} autoComplete="email" inputMode="email" />
            </div>
            <div className="sp-veld sp-veld--breed">
              <label htmlFor="veld-bedrijf">{t.bedrijf}</label>
              <input id="veld-bedrijf" name="bedrijf" maxLength={120} autoComplete="organization" />
            </div>
          </div>
        </fieldset>
        <fieldset data-sp-stap="">
          <legend><h2 data-sp-kop="" data-sp-sjabloon={t.stap2}>{t.stap2Terugval}</h2></legend>
          <div className="sp-kaarten">
            {t.doelen.map((d, i) => (
              <label key={d.waarde} className="sp-kaart">
                <input type="radio" name="doel" value={d.waarde} required={i === 0} />
                <span className="sp-kaart__titel">{d.titel}</span>
                <span className="sp-kaart__tekst">{d.tekst}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset data-sp-stap="">
          <legend><h2 data-sp-kop="" data-sp-sjabloon={t.stap3}>{t.stap3Terugval}</h2></legend>
          <div className="sp-rooster">
            <div className="sp-veld sp-veld--breed">
              <label htmlFor="veld-bericht">{f.bericht}</label>
              <textarea id="veld-bericht" name="bericht" required minLength={2} maxLength={4600} rows={6} data-sp-label="je bericht" />
            </div>
          </div>
          <p className="formulier-privacy intake__privacy">
            {f.privacy} <a className="link" href="/privacy">{f.privacyLink}</a>
          </p>
        </fieldset>
        <input type="hidden" name="pakket" defaultValue="" />
        <div data-sp-val-wrap="" aria-hidden="true">
          <label>Website <input type="text" name="website" data-sp-val="" tabIndex={-1} autoComplete="off" /></label>
        </div>
        <button type="submit">{f.verstuur}</button>
      </StappenPersoonlijk>
      <section data-sp-bedankt="" hidden className="intake__bedankt">
        <h2 data-sp-kop="" data-sp-sjabloon={t.bedankt}>{t.bedanktTerugval}</h2>
        <p>{t.bedanktTekst}</p>
        <ol className="sp-tips">
          {t.tips.map((tip) => <li key={tip}>{tip}</li>)}
        </ol>
        <div className="intake__verder">
          <ChecklistKnop className="knop knop--mint">{kop.checklist}</ChecklistKnop>
          <a className="knop knop--rand" href="/work">{casePagina.terug}</a>
        </div>
      </section>
    </div>
  )
}
