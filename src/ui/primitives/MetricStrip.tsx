import type { ReactNode } from 'react'
import { classNames } from './classNames'

type MetricStripProps = {
  label: string
  children: ReactNode
  className?: string
}

export function MetricStrip({ label, children, className }: MetricStripProps) {
  return (
    <div
      aria-label={label}
      className={classNames(
        'grid auto-cols-fr grid-flow-col gap-px overflow-hidden rounded-card border border-border bg-border',
        className,
      )}
    >
      {children}
    </div>
  )
}

type MetricCellProps = {
  label: ReactNode
  children: ReactNode
  className?: string
}

export function MetricCell({ label, children, className }: MetricCellProps) {
  return (
    <div className={classNames('grid content-start gap-0.5 bg-panel px-2.5 py-2', className)}>
      <span className="text-column uppercase text-text3">{label}</span>
      {children}
    </div>
  )
}

export type MetricTone = 'default' | 'danger' | 'ok'

const TONE_CLASSES: Record<MetricTone, string> = {
  default: 'text-text',
  danger: 'text-danger',
  ok: 'text-ok',
}

type MetricValueProps = {
  tone?: MetricTone
  children: ReactNode
}

export function MetricValue({ tone = 'default', children }: MetricValueProps) {
  return (
    <span
      className={classNames('font-mono text-section-title tabular-nums', TONE_CLASSES[tone])}
    >
      {children}
    </span>
  )
}
