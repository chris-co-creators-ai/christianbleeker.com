import type { ReactNode } from 'react'
import { ChatgptIntakeKnop } from '@/features/chatgpt-intake-knop/ChatgptIntakeKnop'

/**
 * De knop die ChatGPT opent met de website-checklist-prompt (chatgpt-intake-knop). De prompt is
 * 26.000 tekens: de module kopieert hem dan naar het klembord en opent ChatGPT met een korte
 * instructie. Zonder JS opent de link de prompt als tekst.
 */
export function ChecklistKnop({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ChatgptIntakeKnop className="checklist">
      <a
        className={className}
        data-cik-trigger=""
        data-target="chatgpt"
        data-prompt-src="/website-checklist-prompt.txt"
        href="/website-checklist-prompt.txt"
      >
        {children}
      </a>
    </ChatgptIntakeKnop>
  )
}
