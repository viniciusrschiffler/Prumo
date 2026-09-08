import type { ReactNode } from 'react'
import { classNames } from './classNames'

export type StatCardTone = 'default' | 'muted' | 'ok' | 'danger' | 'warn'

// Hoje, Capacidade e TodoList imprimem o número em 18px; Painéis é a única das nove telas que
// o imprime no mesmo passo do título de tela, em mono.
export type StatCardSize = 'default' | 'large'

const TONE_CLASSES: Record<StatCardTone, string> = {
  default: 'text-text',
  muted: 'text-text2',
  ok: 'text-ok',
  danger: 'text-danger',
  warn: 'text-warn',
}

const SIZE_CLASSES: Record<StatCardSize, string> = {
  default: 'text-metric',
  large: 'text-entity-title',
}

type StatCardProps = {
  label: string
  tone?: StatCardTone
  size?: StatCardSize
  hint?: ReactNode
  children: ReactNode
  className?: string
}

export function StatCard({
  label,
  tone = 'default',
  size = 'default',
  hint,
  children,
  className,
}: StatCardProps) {
  return (
    <div
      className={classNames(
        'grid content-start gap-0.5 rounded-card border border-border bg-panel p-2.5',
        className,
      )}
    >
      <span className="text-label font-normal tracking-normal text-text2">{label}</span>
      <span
        className={classNames('font-mono tabular-nums', SIZE_CLASSES[size], TONE_CLASSES[tone])}
      >
        {children}
      </span>
      {hint !== undefined && (
        <span className="text-label font-normal tracking-normal text-text3">{hint}</span>
      )}
    </div>
  )
}
