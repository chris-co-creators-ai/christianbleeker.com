import { NextResponse } from 'next/server'
import { site } from '@/content/site'
import { home, over, ai } from '@/content/teksten'
import { cases } from '@/content/cases'

/** `/llms-full.txt`: de volledige tekst van de site, voor AI-antwoordmachines. */
export const dynamic = 'force-static'

export function GET() {
  const regels = [
    `# ${site.naam}`, '', `> ${site.beschrijving}`, '',
    '## Home', home.intro, ...home.doen.items.map((d) => `- ${d.titel}: ${d.sub} ${d.tekst}`), '',
    `## ${over.kop}`, ...over.alineas, '',
    `## AI`, ai.kop, ai.intro, ai.tweede, ...ai.wat.items.map((i) => `- ${i.titel}: ${i.tekst}`), '',
    '## Werk',
    ...cases.flatMap((c) => [`### ${c.naam}`, c.kort, ...c.alineas, `Ontwerpdoel: ${c.ontwerpdoel}`, '']),
  ]
  return new NextResponse(regels.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
