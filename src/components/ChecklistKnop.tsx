import type { ReactNode } from 'react'
import { ChatgptIntakeKnop } from '@/features/chatgpt-intake-knop/ChatgptIntakeKnop'

/**
 * De knop die ChatGPT opent met de hele website-checklist-prompt al ingevuld (chatgpt-intake-knop),
 * net als op de vorige versie van de site. De link wordt ruim 37.000 tekens; `data-drempel` staat
 * daarom boven de standaard van 8.000, anders valt de module terug op kopiëren en zelf plakken.
 * Zonder JS opent de link de prompt als tekst.
 */
export function ChecklistKnop({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ChatgptIntakeKnop className="checklist">
      <a
        className={className}
        data-cik-trigger=""
        data-target="chatgpt"
        data-drempel="60000"
        data-prompt-src="/website-checklist-prompt.txt"
        href="/website-checklist-prompt.txt"
      >
        {children}
      </a>
    </ChatgptIntakeKnop>
  )
}
