'use client'

import { useEffect, useRef, useState } from 'react'
import { contact, linkedin } from '@/content/teksten'
import { controleer, type Fouten } from '@/lib/contact'

type Staat = 'invullen' | 'bezig' | 'gelukt' | 'mislukt'

/**
 * Contactformulier. Werkt zonder JS (gewone POST naar /api/contact); met JS: controle per veld,
 * versturen zonder paginawissel en een melding die een schermlezer voorleest.
 */
export function ContactFormulier() {
  const t = contact.formulier
  const [staat, setStaat] = useState<Staat>('invullen')
  const [fouten, setFouten] = useState<Fouten>({})
  const geopend = useRef<HTMLInputElement>(null)
  const melding = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (geopend.current) geopend.current.value = String(Date.now())
  }, [])

  async function verstuur(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const v = { naam: String(data.get('naam') ?? ''), email: String(data.get('email') ?? ''), bericht: String(data.get('bericht') ?? '') }
    const f = controleer(v)
    setFouten(f)
    if (Object.keys(f).length) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(f)[0]}"]`)?.focus()
      return
    }
    setStaat('bezig')
    try {
      const r = await fetch('/api/contact', { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      const j = await r.json().catch(() => ({}))
      if (r.status === 422) { setFouten(j.fouten ?? {}); setStaat('invullen'); return }
      setStaat(r.ok && j.status === 'gelukt' ? 'gelukt' : 'mislukt')
      if (r.ok) form.reset()
    } catch {
      setStaat('mislukt')
    }
    requestAnimationFrame(() => melding.current?.focus())
  }

  const veld = (naam: 'naam' | 'email' | 'bericht', label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="veld">
      <label htmlFor={`veld-${naam}`}>{label}</label>
      {naam === 'bericht' ? (
        <textarea id={`veld-${naam}`} name={naam} rows={6} required minLength={2} maxLength={5000}
          aria-invalid={fouten[naam] ? true : undefined} aria-describedby={fouten[naam] ? `fout-${naam}` : undefined} />
      ) : (
        <input id={`veld-${naam}`} name={naam} required maxLength={naam === 'email' ? 254 : 200}
          aria-invalid={fouten[naam] ? true : undefined} aria-describedby={fouten[naam] ? `fout-${naam}` : undefined} {...extra} />
      )}
      {fouten[naam] ? <p id={`fout-${naam}`} className="veld-fout">{fouten[naam]}</p> : null}
    </div>
  )

  return (
    <form className="formulier" action="/api/contact" method="post" noValidate onSubmit={verstuur}>
      {veld('naam', t.naam, { autoComplete: 'name' })}
      {veld('email', t.email, { type: 'email', autoComplete: 'email', inputMode: 'email' })}
      {veld('bericht', t.bericht)}
      <div className="val" aria-hidden="true">
        <label htmlFor="veld-website">Website</label>
        <input id="veld-website" name="website" tabIndex={-1} autoComplete="off" />
        <input ref={geopend} name="_geopend" type="hidden" defaultValue="" />
      </div>
      <p className="formulier-privacy">
        {t.privacy} <a className="link" href="/privacy">{t.privacyLink}</a>
      </p>
      <button className="knop" type="submit" disabled={staat === 'bezig'} aria-disabled={staat === 'bezig' ? true : undefined}>
        {staat === 'bezig' ? t.bezig : t.verstuur}
      </button>
      <p ref={melding} tabIndex={-1} role="status" className={`formulier-melding formulier-melding--${staat}`}>
        {staat === 'gelukt' ? t.gelukt : staat === 'mislukt' ? t.mislukt : ''}
        {staat === 'mislukt' ? <> <a className="link" href={linkedin} target="_blank" rel="noopener noreferrer">{contact.linkedin}</a></> : null}
      </p>
    </form>
  )
}
