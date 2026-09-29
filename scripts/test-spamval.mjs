#!/usr/bin/env node
/**
 * Kleine, framework-loze check voor de pure beslisfunctie in `src/lib/spamval.ts`.
 * Draait met gewoon `node` — Node 24 leest TypeScript-syntax native (zie `engines` in
 * package.json). Geen testrunner, geen dependency: `assert` uit de standaardbibliotheek.
 *
 *   node scripts/test-spamval.mjs
 */
import assert from 'node:assert/strict'
import { isSpamInzending, isZakelijkEmail, MINIMALE_INVULTIJD_MS } from '../src/lib/spamval.ts'

const nu = 1_000_000

// Lege honeypot, geen tijdstip aangeleverd (geen JS) → niet als spam behandelen.
assert.equal(isSpamInzending('', null, nu), false, 'geen honeypot + onbekende tijd = geen spam')
assert.equal(isSpamInzending('', undefined, nu), false, 'undefined-tijd = geen spam')
assert.equal(isSpamInzending('', '', nu), false, 'lege string-tijd = geen spam')

// Honeypot gevuld → altijd spam, ongeacht de tijd.
assert.equal(isSpamInzending('vult-een-bot-in', null, nu), true, 'gevulde honeypot = spam')
assert.equal(isSpamInzending('  spam  ', String(nu - 10_000), nu), true, 'honeypot wint van een geldige tijd')

// Alleen witruimte in de honeypot telt als leeg.
assert.equal(isSpamInzending('   ', null, nu), false, 'alleen witruimte = geen honeypot-hit')

// Te snel ingevuld.
assert.equal(
  isSpamInzending('', String(nu - (MINIMALE_INVULTIJD_MS - 1)), nu),
  true,
  'net onder de minimale invultijd = spam',
)
assert.equal(
  isSpamInzending('', String(nu - MINIMALE_INVULTIJD_MS), nu),
  false,
  'precies op de grens = geen spam',
)
assert.equal(
  isSpamInzending('', String(nu - (MINIMALE_INVULTIJD_MS + 1)), nu),
  false,
  'ruim genoeg tijd = geen spam',
)

// Ongeldig tijdstip (geknoei met het veld) → behandelen als onbekend, niet als spam.
assert.equal(isSpamInzending('', 'geen-getal', nu), false, 'niet-numerieke tijd = onbekend, geen spam')

// Getal in plaats van string mag ook.
assert.equal(isSpamInzending('', nu - 500, nu), true, 'numerieke invoer werkt net als string')

// Zakelijk e-mailadres (B2B-optie).
assert.equal(isZakelijkEmail('jan@bakkerij-devries.nl'), true, 'eigen domein = zakelijk')
assert.equal(isZakelijkEmail('Jan@Gmail.com'), false, 'gmail (hoofdletters) = niet zakelijk')
assert.equal(isZakelijkEmail(' piet@hotmail.nl '), false, 'hotmail.nl met spaties = niet zakelijk')
assert.equal(isZakelijkEmail('geen-apenstaart'), false, 'geen @ = niet zakelijk')
assert.equal(isZakelijkEmail('x@localhost'), false, 'domein zonder punt = niet zakelijk')

console.log('spamval: alle checks geslaagd (16/16)')
