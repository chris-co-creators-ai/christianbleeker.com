import { websiteChecklistPrompt } from '@/content/checklist-prompt'

/** De intakeprompt achter de knop "Website-checklist prompt ↗", als platte tekst (werkt ook zonder JS). */
export const dynamic = 'force-static'

export function GET() {
  return new Response(websiteChecklistPrompt, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
