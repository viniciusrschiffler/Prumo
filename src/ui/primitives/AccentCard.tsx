import type { ReactNode } from 'react'
import { classNames } from './classNames'

export type AccentCardTone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info' | 'accent' | 'scope'

const BORDER_CLASSES: Record<AccentCardTone, string> = {
  neutral: 'border-l-text3',
  ok: 'border-l-ok',
  warn: 'border-l-warn',
  danger: 'border-l-danger',
  info: 'border-l-info',
  accent: 'border-l-accent',
  scope: 'border-l-event-scope',
}

type AccentCardProps = {
  tone: AccentCardTone
  children: ReactNode
  className?: string
}

export function AccentCard({ tone, children, className }: AccentCardProps) {
  return (
    <article
      className={classNames(
        'grid gap-1.5 rounded-card border border-l-2 border-border bg-panel px-[11px] py-2.5',
        BORDER_CLASSES[tone],
        className,
      )}
    >
      {children}
    </article>
  )
}
