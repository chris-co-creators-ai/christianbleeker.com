// node scripts/test-csp.mjs — de CSP die next.config.ts meestuurt (Node ≥ 23 draait .ts zelf).
import assert from 'node:assert/strict'
import { bouwCsp } from '../src/lib/csp.ts'

const kaal = bouwCsp({})
for (const regel of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'self'", "connect-src 'self'"])
  assert.ok(kaal.includes(regel), `mist: ${regel}`)
assert.ok(!/https?:\/\//.test(kaal), 'de kale basis laadt niets van buiten')
assert.ok(!kaal.includes('unsafe-eval'), 'geen eval in productie')
assert.ok(bouwCsp({ dev: true }).includes("'unsafe-eval'"), 'dev heeft eval voor de foutoverlay')
const ga = bouwCsp({ meting: { ga4: 'G-X' } })
assert.ok(/script-src[^;]*googletagmanager/.test(ga) && /connect-src[^;]*google-analytics/.test(ga), 'GA4 alleen met ID')
assert.ok(!bouwCsp({ meting: { ga4: '' } }).includes('google'), 'leeg ID = geen Google')
assert.ok(/script-src[^;]*clarity\.ms/.test(bouwCsp({ meting: { clarity: 'abc' } })), 'Clarity met ID')
assert.ok(/frame-src[^;]*youtube-nocookie/.test(bouwCsp({ extra: { 'frame-src': ['https://www.youtube-nocookie.com'] } })), 'extra per onderdeel')
assert.ok(/frame-src[^;]*vercel\.live/.test(bouwCsp({ preview: true })) && !kaal.includes('vercel.live'), 'Vercel-werkbalk alleen op preview')
console.log('test-csp: 10/10 groen')
