import { NextResponse } from 'next/server'
import { site } from '@/content/site'
import { routes } from '@/content/routes'

/** `/llms.txt` (llmstxt.org): naam, beschrijving en elke pagina met zijn beschrijving. */
export const dynamic = 'force-static'

export function GET() {
  const regels = [
    `# ${site.naam}`,
    '',
    `> ${site.beschrijving}`,
    '',
    "## Pagina's",
    ...routes.map((r) => `- [${r.titel}](${r.pad === '/' ? site.domein : site.domein + r.pad}): ${r.beschrijving}`),
    '',
    '## Optional',
    `- [Volledige inhoud](${site.domein}/llms-full.txt): alle teksten van de site.`,
  ]
  return new NextResponse(regels.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
