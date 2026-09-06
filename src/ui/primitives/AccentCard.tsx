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

// O histórico do projeto empilha muito cartão e os aperta; o card de decisão da tela de Hoje
// é um só e respira. Entre duas utilidades de gap ou de padding quem decide é a ordem na
// folha de estilo, então a escolha é prop.
export type AccentCardSpacing = 'default' | 'relaxed'

const SPACING_CLASSES: Record<AccentCardSpacing, string> = {
  default: 'gap-1.5 px-[11px] py-2.5',
  relaxed: 'gap-[9px] p-[11px]',
}

type AccentCardProps = {
  tone: AccentCardTone
  spacing?: AccentCardSpacing
  children: ReactNode
  className?: string
}

export function AccentCard({ tone, spacing = 'default', children, className }: AccentCardProps) {
  return (
    <article
      className={classNames(
        'grid rounded-card border border-l-2 border-border bg-panel',
        SPACING_CLASSES[spacing],
        BORDER_CLASSES[tone],
        className,
      )}
    >
      {children}
    </article>
  )
}
