import type { ReactNode } from 'react'
import { classNames } from './classNames'

export type StatCardTone = 'default' | 'muted' | 'ok' | 'danger' | 'warn'

const TONE_CLASSES: Record<StatCardTone, string> = {
  default: 'text-text',
  muted: 'text-text2',
  ok: 'text-ok',
  danger: 'text-danger',
  warn: 'text-warn',
}

type StatCardProps = {
  label: string
  tone?: StatCardTone
  children: ReactNode
  className?: string
}

export function StatCard({ label, tone = 'default', children, className }: StatCardProps) {
  return (
    <div
      className={classNames(
        'grid content-start gap-0.5 rounded-card border border-border bg-panel p-2.5',
        className,
      )}
    >
      <span className="text-label font-normal tracking-normal text-text2">{label}</span>
      <span className={classNames('font-mono text-metric tabular-nums', TONE_CLASSES[tone])}>
        {children}
      </span>
    </div>
  )
}
