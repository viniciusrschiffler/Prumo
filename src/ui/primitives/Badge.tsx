import type { ReactNode } from 'react'
import { classNames } from './classNames'

export type BadgeTone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info' | 'accent'
export type BadgeVariant = 'soft' | 'solid' | 'cancelled'
export type BadgeSize = 'default' | 'small'

const SOFT_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-neutral-soft text-text2',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  accent: 'bg-accent-soft text-accent',
}

const SOLID_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-text3 text-accent-fg',
  ok: 'bg-ok text-accent-fg',
  warn: 'bg-warn text-accent-fg',
  danger: 'bg-danger text-accent-fg',
  info: 'bg-info text-accent-fg',
  accent: 'bg-accent text-accent-fg',
}

const BORDER_CLASSES: Record<BadgeTone, string> = {
  neutral: 'border border-border',
  ok: 'border border-ok',
  warn: 'border border-warn',
  danger: 'border border-danger',
  info: 'border border-info',
  accent: 'border border-accent',
}

const DOT_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-text3',
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  info: 'bg-info',
  accent: 'bg-accent',
}

const SIZE_CLASSES: Record<BadgeSize, string> = {
  default: 'px-[7px] py-px text-label',
  small: 'px-1.5 py-px text-micro font-semibold',
}

type BadgeProps = {
  tone?: BadgeTone
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  bordered?: boolean
  uppercase?: boolean
  children: ReactNode
  className?: string
}

export function Badge({
  tone = 'neutral',
  variant = 'soft',
  size = 'default',
  dot = false,
  bordered = false,
  uppercase = false,
  children,
  className,
}: BadgeProps) {
  const isCancelled = variant === 'cancelled'

  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-badge font-semibold',
        SIZE_CLASSES[size],
        isCancelled
          ? 'border border-dashed border-border-strong bg-transparent text-text3 line-through'
          : variant === 'solid'
            ? SOLID_CLASSES[tone]
            : SOFT_CLASSES[tone],
        bordered && !isCancelled ? BORDER_CLASSES[tone] : '',
        uppercase ? 'uppercase tracking-[0.02em]' : '',
        className,
      )}
    >
      {dot && !isCancelled && (
        <span className={classNames('h-1.5 w-1.5 flex-none rounded-full', DOT_CLASSES[tone])} />
      )}
      {children}
    </span>
  )
}
