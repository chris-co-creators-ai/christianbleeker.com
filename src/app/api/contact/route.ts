import { site } from '@/content/site'
import { contact, linkedin } from '@/content/teksten'
import { controleer } from '@/lib/contact'
import { isSpamInzending } from '@/lib/spamval'
import { bouwAanvraagKlantMail, bouwAanvraagBevestigingMail, verstuurMail, escapeHtml } from '@/lib/mail'

/**
 * Contactformulier. JSON-antwoord voor de versie met JavaScript, een kleine HTML-pagina zonder.
 * Geen ontvanger (`site.mail.naar` leeg) of geen Resend-sleutel: dan "mislukt", met LinkedIn als uitweg:
 * een bericht gaat nooit stil verloren.
 */
export async function POST(req: Request) {
  const metJs = (req.headers.get('accept') || '').includes('application/json')
  const form = await req.formData()
  const waarde = (k: string) => String(form.get(k) ?? '')
  const velden = { naam: waarde('naam'), email: waarde('email'), bericht: waarde('bericht') }

  const antwoord = (status: 'gelukt' | 'mislukt' | 'ongeldig', code: number, fouten = {}) => {
    if (metJs) return Response.json({ status, fouten }, { status: code })
    const tekst = status === 'gelukt' ? contact.formulier.gelukt : status === 'ongeldig'
      ? Object.values(fouten).join(' ') : contact.formulier.mislukt
    const html = `<!doctype html><html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(contact.kop)}</title><body style="background:#17110f;color:#f5ece3;font:17px/1.55 system-ui,sans-serif;padding:48px 20px;max-width:40rem;margin:auto"><p role="status">${escapeHtml(tekst)}</p><p><a style="color:#a8e0d6" href="/contact">${escapeHtml(contact.kop)}</a> · <a style="color:#a8e0d6" href="${linkedin}">${escapeHtml(contact.linkedin)}</a></p></body></html>`
    return new Response(html, { status: code, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  // Spam: stil "gelukt" teruggeven, zodat een bot niets leert.
  if (isSpamInzending(waarde('website'), waarde('_geopend'))) return antwoord('gelukt', 200)

  const fouten = controleer(velden)
  if (Object.keys(fouten).length) return antwoord('ongeldig', 422, fouten)

  if (!site.mail.naar) {
    console.error('[contact] geen ontvanger ingesteld (site.mail.naar is leeg)')
    return antwoord('mislukt', 503)
  }
  const klant = await verstuurMail(site.mail.van, site.mail.naar, bouwAanvraagKlantMail(site.domein, { ...velden, interesse: 'kennismaking' }), velden.email)
  if (!klant.verzonden) return antwoord('mislukt', 502)
  await verstuurMail(site.mail.van, velden.email, bouwAanvraagBevestigingMail(site.domein, site.naam, velden.naam), site.mail.naar)
  return antwoord('gelukt', 200)
}
