#!/usr/bin/env node
/**
 * Kleine, framework-loze check voor `src/lib/mail.ts` — zelfde conventie als
 * `scripts/test-spamval.mjs` (gewoon `node`, geen testrunner, `assert` uit de standaardbibliotheek).
 * `mail.ts` importeert bewust geen `content/site.ts` (het `@/`-alias kent Node's ingebouwde
 * TypeScript-ondersteuning niet), dus dit script kan het rechtstreeks importeren.
 *
 *   node scripts/test-mail.mjs
 */
import assert from 'node:assert/strict'
import { site } from '../src/content/site.ts'
import {
  bouwAanvraagBevestigingMail,
  bouwAanvraagKlantMail,
  bouwNieuwsbriefBevestigingMail,
  bouwNieuwsbriefKlantMail,
  bouwResendPayload,
  verstuurMail,
} from '../src/lib/mail.ts'

let n = 0
function check(naam, conditie) {
  n += 1
  assert.ok(conditie, naam)
}

// ── 1. Zonder sleutel: geen verzendpoging ───────────────────────────────────────────────────
delete process.env.RESEND_API_KEY
{
  const resultaat = await verstuurMail('van@example.com', 'aan@example.com', {
    onderwerp: 'test',
    tekst: 'test',
    html: '<p>test</p>',
  })
  check('zonder sleutel: reden = geen-sleutel', resultaat.reden === 'geen-sleutel')
  check('zonder sleutel: niet verzonden', resultaat.verzonden === false)
}

// ── 2. Links bevatten site.domein, nooit localhost ──────────────────────────────────────────
{
  const klant = bouwAanvraagKlantMail(site.domein, { interesse: 'Fysiotherapie', naam: 'Jan', email: 'jan@voorbeeld.nl' })
  check('aanvraag-klantmail: tekst bevat site.domein', klant.tekst.includes(site.domein))
  check('aanvraag-klantmail: html bevat site.domein', klant.html.includes(site.domein))
  check('aanvraag-klantmail: geen localhost in tekst', !klant.tekst.toLowerCase().includes('localhost'))
  check('aanvraag-klantmail: geen localhost in html', !klant.html.toLowerCase().includes('localhost'))

  const bevestiging = bouwAanvraagBevestigingMail(site.domein, site.voet.bedrijf, 'Jan')
  check('aanvraag-bevestiging: html bevat site.domein', bevestiging.html.includes(site.domein))
  check('aanvraag-bevestiging: geen localhost', !bevestiging.html.toLowerCase().includes('localhost'))

  const nbKlant = bouwNieuwsbriefKlantMail(site.domein, site.voet.bedrijf, 'jan@voorbeeld.nl')
  check('nieuwsbrief-klantmail: html bevat site.domein', nbKlant.html.includes(site.domein))

  const nbBevestiging = bouwNieuwsbriefBevestigingMail(site.domein, site.voet.bedrijf)
  check('nieuwsbrief-bevestiging: html bevat site.domein', nbBevestiging.html.includes(site.domein))
  check('nieuwsbrief-bevestiging: geen localhost', !nbBevestiging.html.toLowerCase().includes('localhost'))

  // Zelfs met een expres foute (localhost-)domeinwaarde erin geplakt zou 'ie gewoon doorgeven —
  // dit bewijst niet dat mail.ts localhost tegenhoudt (dat is niet zijn taak), maar dat een
  // aanroepende form-action hem altijd met `site.domein` moet voeden, nooit met een
  // hardgecodeerde host.
}

// ── 3. HTML-injectie in naam/bericht wordt geëscaped ────────────────────────────────────────
{
  const kwaadaardig = '<img src=x onerror=alert(1)>Piet'
  const klant = bouwAanvraagKlantMail(site.domein, {
    interesse: 'Fysiotherapie',
    naam: kwaadaardig,
    toelichting_verplicht: '<script>alert(document.cookie)</script>',
  })
  check('naam: geen rauwe <img> in html', !klant.html.includes('<img src=x'))
  check('naam: wel geëscapete variant in html', klant.html.includes('&lt;img src=x'))
  check('bericht: geen rauwe <script> in html', !klant.html.includes('<script>alert'))
  check('bericht: wel geëscapete variant in html', klant.html.includes('&lt;script&gt;'))
  // Onderwerp gaat als los JSON-veld naar Resend (geen SMTP-header-risico), maar een naam met
  // een regeleinde hoort er sowieso niet in door te lekken.
  const metRegeleinde = bouwAanvraagKlantMail(site.domein, { interesse: 'Anders', naam: 'Piet\nBcc: kwaad@voorbeeld.nl' })
  check('onderwerp: geen regeleinde', !metRegeleinde.onderwerp.includes('\n'))

  const bevestiging = bouwAanvraagBevestigingMail(site.domein, site.voet.bedrijf, kwaadaardig)
  check('bevestiging: naam geëscaped in html', !bevestiging.html.includes('<img src=x') && bevestiging.html.includes('&lt;img'))
}

// ── 4. replyTo — gedeeld Seveke-verzenddomein, zie site.ts § mail en mail.ts § bouwResendPayload ─
// `verstuurMail` roept zelf de echte Resend-SDK aan (netwerk), dus deze check test de pure
// `bouwResendPayload` rechtstreeks — dezelfde functie die `verstuurMail` gebruikt om het object op
// te bouwen dat naar Resend gaat.
{
  const payloadMetReplyTo = bouwResendPayload('Klant via Seveke Creative <formulier@seveke.nl>', 'klant@voorbeeld.nl', {
    onderwerp: 'test', tekst: 'test', html: '<p>test</p>',
  }, 'bezoeker@voorbeeld.nl')
  check('met replyTo: reply_to staat op het bezoekersadres', payloadMetReplyTo.reply_to === 'bezoeker@voorbeeld.nl')
  check('met replyTo: from blijft het gedeelde Seveke-adres', payloadMetReplyTo.from === 'Klant via Seveke Creative <formulier@seveke.nl>')

  const payloadZonderReplyTo = bouwResendPayload('van@voorbeeld.nl', 'aan@voorbeeld.nl', { onderwerp: 't', tekst: 't', html: '<p>t</p>' })
  check('zonder replyTo: geen reply_to-veld op de payload', !('reply_to' in payloadZonderReplyTo))
}

console.log(`mail: alle checks geslaagd (${n}/${n})`)
