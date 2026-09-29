#!/usr/bin/env node
/**
 * Test voor `scripts/indexnow-lib.mjs` — draait tegen een lokaal http-servertje dat het
 * IndexNow-endpoint nadoet (nooit tegen `api.indexnow.org`). Controleert:
 *   1. `vercelEnv: 'production'` → precies één POST, met host/key/keyLocation/urlList kloppend,
 *      én het sleutelbestand daadwerkelijk in `publicDir` geschreven.
 *   2. `vercelEnv` leeg (lokaal) en `vercelEnv: 'preview'` → geen enkele request naar het endpoint.
 *
 *   node scripts/test-indexnow-lib.mjs
 */
import assert from 'node:assert/strict'
import http from 'node:http'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { indexNowSleutel, pingIndexNow } from './indexnow-lib.mjs'

let n = 0
function check(naam, ok) {
  n += 1
  assert.ok(ok, naam)
  console.log(`  OK: ${naam}`)
}

const ontvangenRequests = []
const server = http.createServer((req, res) => {
  let raw = ''
  req.on('data', (chunk) => (raw += chunk))
  req.on('end', () => {
    ontvangenRequests.push({ method: req.method, url: req.url, body: raw ? JSON.parse(raw) : null })
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('OK')
  })
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const { port } = server.address()
const endpoint = `http://127.0.0.1:${port}/indexnow`

const domein = 'https://www.test-fysiobakker.nl'
const paden = ['/', '/artikelen', '/artikelen/voorbeeld-slug']
const publicDir = await mkdtemp(path.join(tmpdir(), 'indexnow-test-'))

try {
  console.log('--- 1. productie: verstuurt POST met host/key/urlList ---')
  const verwachteSleutel = indexNowSleutel(domein)
  const resultaat = await pingIndexNow({ domein, paden, vercelEnv: 'production', publicDir, endpoint })

  check('pingIndexNow meldt gepingd: true', resultaat.gepingd === true)
  check('endpoint kreeg precies 1 request', ontvangenRequests.length === 1)

  const { body } = ontvangenRequests[0]
  console.log('  geplakte POST-body:', JSON.stringify(body, null, 2))
  check('body.host is de hostname', body.host === 'www.test-fysiobakker.nl')
  check('body.key is de afgeleide sleutel', body.key === verwachteSleutel)
  check('body.keyLocation wijst naar <domein>/<sleutel>.txt', body.keyLocation === `${domein}/${verwachteSleutel}.txt`)
  check(
    'body.urlList bevat alle paden, met domein ervoor',
    JSON.stringify(body.urlList) === JSON.stringify(paden.map((p) => `${domein}${p}`)),
  )

  const sleutelbestand = await readFile(path.join(publicDir, `${verwachteSleutel}.txt`), 'utf8')
  check('sleutelbestand in publicDir bevat exact de sleutel', sleutelbestand === verwachteSleutel)

  console.log('\n--- 2. preview/lokaal: verstuurt niets ---')
  ontvangenRequests.length = 0
  const previewResultaat = await pingIndexNow({ domein, paden, vercelEnv: 'preview', publicDir, endpoint })
  check('preview: gepingd: false', previewResultaat.gepingd === false)
  check('preview: geen enkele request naar het endpoint', ontvangenRequests.length === 0)

  const lokaalResultaat = await pingIndexNow({ domein, paden, vercelEnv: undefined, publicDir, endpoint })
  check('lokaal (geen VERCEL_ENV): gepingd: false', lokaalResultaat.gepingd === false)
  check('lokaal: geen enkele request naar het endpoint', ontvangenRequests.length === 0)

  console.log(`\n${n} checks, allemaal OK.`)
} finally {
  await new Promise((resolve) => server.close(resolve))
  await rm(publicDir, { recursive: true, force: true })
}
