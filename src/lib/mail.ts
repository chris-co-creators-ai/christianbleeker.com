/**
 * Mailverzending via Resend — bouwstenen voor een aanvraag-/nieuwsbriefformulier dat een klant via
 * de PRD krijgt (deze kale basis heeft zelf geen formulier meer, zie `LEESMIJ.md`). Een
 * form-action die een klant later toevoegt roept `bouwAanvraagKlantMail`/`bouwNieuwsbriefKlantMail`
 * e.a. hieronder aan en geeft het resultaat door aan `verstuurMail`.
 *
 * ── Puur waar het kan, net als `spamval.ts` ─────────────────────────────────────────────────
 * De `bouw*Mail`-functies hieronder bouwen alleen onderwerp/tekst/html op — geen `fetch`, geen
 * `process.env`, en bewust GEEN import van `content/site.ts` (dat loopt via het `@/`-alias, dat
 * Node's ingebouwde TypeScript-ondersteuning niet kent — zie `scripts/test-mail.mjs`, dat dit
 * bestand rechtstreeks met `node` importeert, zonder Next.js/bundler ertussen). Domein en
 * bedrijfsnaam komen daarom als parameter binnen; een aanroepende form-action geeft
 * `site.domein`/`site.voet.bedrijf` door.
 *
 * ── Zonder sleutel: dev-gedrag, geen crash ──────────────────────────────────────────────────
 * `verstuurMail` stuurt alleen als `process.env.RESEND_API_KEY` is gezet. Zonder sleutel logt hij
 * dat er niet gemaild is en doet geen enkele netwerkaanroep. Mét sleutel en een échte Resend-fout:
 * geen stille mislukking, de aanroeper krijgt `reden: 'mislukt'` terug.
 */
import { Resend } from 'resend'

export type MailInhoud = { onderwerp: string; tekst: string; html: string }

export function escapeHtml(waarde: string): string {
  return waarde
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Onderwerpregels gaan als JSON-veld naar Resend, geen los SMTP-headerrisico — maar een
 *  regeleinde in een naam hoort sowieso niet in een onderwerp terecht te komen. */
function eenRegel(waarde: string): string {
  return waarde.replace(/[\r\n]+/g, ' ').trim()
}

function veldLabel(sleutel: string): string {
  // "toelichting_verplicht" → "toelichting" — een `_verplicht`-achtervoegsel is een conventie om
  // een apart verplicht/optioneel-veldpaar te onderscheiden in een formulier; de klant-mail hoeft
  // dat onderscheid niet te tonen.
  return sleutel.replace(/_verplicht$/, '').replace(/_/g, ' ')
}

function mailSjabloon(domein: string, titel: string, alineas: string[]): string {
  const domeinTekst = domein.replace(/^https?:\/\//, '')
  const body = alineas.map((a) => `<p style="margin:0 0 14px;line-height:1.5;">${a}</p>`).join('\n      ')
  return `<!doctype html>
<html lang="nl">
  <body style="margin:0;padding:32px 16px;background:#f4f4f1;color:#101010;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;">
      <div style="width:48px;height:6px;background:#101010;border-radius:999px;margin-bottom:20px;"></div>
      <h1 style="font-size:20px;margin:0 0 16px;">${escapeHtml(titel)}</h1>
      ${body}
      <p style="margin:24px 0 0;font-size:13px;color:#595959;">
        <a href="${domein}" style="color:#101010;text-decoration:none;">${escapeHtml(domeinTekst)}</a>
      </p>
    </div>
  </body>
</html>`
}

/** Klant-mail bij een nieuwe aanvraag — alle ingevulde velden op een rij. `data` is bewust
 *  generiek (`Record<string, string | undefined>`): een formulier-action die een klant later krijgt past
 *  daar structureel in, zonder dat dit bestand die import (en dus de `@/`-alias) nodig heeft. */
export function bouwAanvraagKlantMail(domein: string, data: Record<string, string | undefined>): MailInhoud {
  const naam = data.naam?.trim() || 'Onbekend'
  const interesse = data.interesse?.trim() || 'iets anders'
  const velden = Object.entries(data).filter(
    ([sleutel, waarde]) => waarde && waarde.trim() !== '' && sleutel !== 'interesse' && !sleutel.startsWith('_'),
  ) as [string, string][]

  const onderwerp = eenRegel(`Nieuwe aanvraag (${interesse}) — ${naam}`)
  const tekst = [
    `Nieuwe aanvraag via ${domein}.`,
    '',
    `interesse: ${interesse}`,
    ...velden.map(([sleutel, waarde]) => `${veldLabel(sleutel)}: ${waarde}`),
  ].join('\n')
  const html = mailSjabloon(domein, onderwerp, [
    `Nieuwe aanvraag via <a href="${domein}" style="color:#101010;">${escapeHtml(domein)}</a>.`,
    `<strong>interesse:</strong> ${escapeHtml(interesse)}`,
    ...velden.map(([sleutel, waarde]) => `<strong>${escapeHtml(veldLabel(sleutel))}:</strong> ${escapeHtml(waarde)}`),
  ])
  return { onderwerp, tekst, html }
}

/** Bevestigingsmail naar de bezoeker zelf, ná een geslaagde aanvraag. */
export function bouwAanvraagBevestigingMail(domein: string, bedrijfsnaam: string, naam: string | undefined): MailInhoud {
  const aanhef = naam?.trim() ? `Hoi ${naam.trim()},` : 'Hoi,'
  const onderwerp = eenRegel(`Je aanvraag is binnen — ${bedrijfsnaam}`)
  const tekst = [
    aanhef,
    '',
    "Bedankt voor je aanvraag. Ik lees 'm persoonlijk en neem snel contact met je op.",
    '',
    'Met vriendelijke groet,',
    bedrijfsnaam,
    domein,
  ].join('\n')
  const html = mailSjabloon(domein, onderwerp, [
    escapeHtml(aanhef),
    "Bedankt voor je aanvraag. Ik lees 'm persoonlijk en neem snel contact met je op.",
    `Met vriendelijke groet,<br>${escapeHtml(bedrijfsnaam)}`,
  ])
  return { onderwerp, tekst, html }
}

/** Klant-mail bij een nieuwe nieuwsbrief-inschrijving. */
export function bouwNieuwsbriefKlantMail(domein: string, bedrijfsnaam: string, email: string): MailInhoud {
  const onderwerp = eenRegel(`Nieuwe nieuwsbrief-inschrijving — ${bedrijfsnaam}`)
  const tekst = `Nieuw e-mailadres via ${domein}: ${email}`
  const html = mailSjabloon(domein, onderwerp, [
    `<strong>e-mailadres:</strong> ${escapeHtml(email)}`,
  ])
  return { onderwerp, tekst, html }
}

/** Bevestigingsmail naar de bezoeker die zich net inschreef. */
export function bouwNieuwsbriefBevestigingMail(domein: string, bedrijfsnaam: string): MailInhoud {
  const onderwerp = eenRegel(`Welkom bij de nieuwsbrief van ${bedrijfsnaam}`)
  const tekst = ['Bedankt voor je inschrijving.', `Je ontvangt vanaf nu bericht van ${bedrijfsnaam}.`, domein].join('\n')
  const html = mailSjabloon(domein, onderwerp, [
    'Bedankt voor je inschrijving.',
    `Je ontvangt vanaf nu bericht van ${escapeHtml(bedrijfsnaam)}.`,
  ])
  return { onderwerp, tekst, html }
}

export type VerstuurResultaat = { verzonden: boolean; reden: 'geen-sleutel' | 'gelukt' | 'mislukt' }

/**
 * Bouwt het object dat naar `resend.emails.send()` gaat — apart van `verstuurMail` zodat
 * `scripts/test-mail.mjs` de `reply_to`-waarde kan controleren zonder een echte sleutel of
 * netwerkaanroep nodig te hebben (zie dat script § replyTo).
 *
 * ── replyTo, gedeeld Seveke-verzenddomein (24-09-2026) ──────────────────────────────────────
 * Alle klantsites verzenden vanaf één bij Resend geverifieerd Seveke-domein (`site.mail.van`,
 * standaard `"<Sitenaam> via Seveke Creative <formulier@seveke.nl>"`) — zo hoeft niet elke klant
 * zelf een domein bij Resend te verifiëren (Resend-free: 1 domein, 3.000 mail/mnd, 100/dag).
 * `replyTo` maakt "Beantwoorden" ondanks het gedeelde afzenderadres alsnog bruikbaar: de mail naar
 * de klant krijgt de bezoeker als `replyTo` (rechtstreeks antwoorden aan de bezoeker), de
 * bevestiging aan de bezoeker krijgt het klantadres als `replyTo` (rechtstreeks antwoorden aan de
 * klant).
 */
export function bouwResendPayload(van: string, aan: string, inhoud: MailInhoud, replyTo?: string) {
  return {
    from: van,
    to: aan,
    subject: inhoud.onderwerp,
    text: inhoud.tekst,
    html: inhoud.html,
    ...(replyTo ? { reply_to: replyTo } : {}),
  }
}

/**
 * Enige plek die daadwerkelijk mailt. `van`/`aan` zijn losse parameters (geen `site`-import, zie
 * het bestandscommentaar) — de aanroeper geeft `site.mail.van` resp. het klant- of
 * bezoekersadres mee. `replyTo` is optioneel, zie `bouwResendPayload` hierboven.
 */
export async function verstuurMail(van: string, aan: string, inhoud: MailInhoud, replyTo?: string): Promise<VerstuurResultaat> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log(`[mail] geen RESEND_API_KEY ingesteld — niet gemaild naar ${aan}: "${inhoud.onderwerp}"`)
    return { verzonden: false, reden: 'geen-sleutel' }
  }
  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send(bouwResendPayload(van, aan, inhoud, replyTo))
    if (error) {
      console.error('[mail] Resend gaf een foutmelding terug:', error)
      return { verzonden: false, reden: 'mislukt' }
    }
    return { verzonden: true, reden: 'gelukt' }
  } catch (fout) {
    console.error('[mail] versturen mislukte:', fout)
    return { verzonden: false, reden: 'mislukt' }
  }
}
