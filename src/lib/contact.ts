import { contact } from '@/content/teksten'

/** Veldcontrole van het contactformulier — dezelfde regels in de browser en op de server. */
export type Velden = { naam: string; email: string; bericht: string }
export type Fouten = Partial<Record<keyof Velden, string>>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function controleer(v: Velden): Fouten {
  const f: Fouten = {}
  if (!v.naam.trim() || v.naam.length > 200) f.naam = contact.formulier.fouten.naam
  if (!EMAIL.test(v.email.trim()) || v.email.length > 254) f.email = contact.formulier.fouten.email
  if (v.bericht.trim().length < 2 || v.bericht.length > 5000) f.bericht = contact.formulier.fouten.bericht
  return f
}
