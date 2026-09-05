import type { ReactNode } from 'react'
import { classNames } from './classNames'

export type BadgeTone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info' | 'accent' | 'scope'
export type BadgeVariant = 'soft' | 'solid' | 'outline' | 'cancelled'
export type BadgeSize = 'default' | 'small'

const SOFT_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-neutral-soft text-text2',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  accent: 'bg-accent-soft text-accent',
  scope: 'bg-event-scope-soft text-event-scope',
}

const SOLID_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-text3 text-accent-fg',
  ok: 'bg-ok text-accent-fg',
  warn: 'bg-warn text-accent-fg',
  danger: 'bg-danger text-accent-fg',
  info: 'bg-info text-accent-fg',
  accent: 'bg-accent text-accent-fg',
  scope: 'bg-event-scope text-accent-fg',
}

const BORDER_CLASSES: Record<BadgeTone, string> = {
  neutral: 'border border-border',
  ok: 'border border-ok',
  warn: 'border border-warn',
  danger: 'border border-danger',
  info: 'border border-info',
  accent: 'border border-accent',
  scope: 'border border-event-scope',
}

const OUTLINE_TEXT_CLASSES: Record<BadgeTone, string> = {
  neutral: 'text-text3',
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
  info: 'text-info',
  accent: 'text-accent',
  scope: 'text-event-scope',
}

const DOT_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-text3',
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  info: 'bg-info',
  accent: 'bg-accent',
  scope: 'bg-event-scope',
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
  dashed?: boolean
  uppercase?: boolean
  // A pílula de tag do design não tem peso: é texto de apoio dentro de uma borda, não rótulo.
  weight?: 'semibold' | 'normal'
  children: ReactNode
  className?: string
}

function toSurfaceClasses(tone: BadgeTone, variant: BadgeVariant): string {
  if (variant === 'cancelled') {
    return 'border border-dashed border-border-strong bg-transparent text-text3 line-through'
  }

  if (variant === 'outline') {
    return classNames('bg-transparent', BORDER_CLASSES[tone], OUTLINE_TEXT_CLASSES[tone])
  }

  return variant === 'solid' ? SOLID_CLASSES[tone] : SOFT_CLASSES[tone]
}

export function Badge({
  tone = 'neutral',
  variant = 'soft',
  size = 'default',
  dot = false,
  bordered = false,
  dashed = false,
  uppercase = false,
  weight = 'semibold',
  children,
  className,
}: BadgeProps) {
  const isCancelled = variant === 'cancelled'

  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-badge',
        weight === 'semibold' ? 'font-semibold' : 'font-normal tracking-normal',
        SIZE_CLASSES[size],
        toSurfaceClasses(tone, variant),
        bordered && variant !== 'outline' && !isCancelled ? BORDER_CLASSES[tone] : '',
        dashed && !isCancelled ? 'border-dashed' : '',
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
