import type { ReactNode } from 'react'
import { classNames } from './classNames'

export type AlertLevel = 'danger' | 'warn' | 'info'

const CONTAINER_CLASSES: Record<AlertLevel, string> = {
  danger: 'border-danger bg-danger-soft',
  warn: 'border-warn bg-warn-soft',
  info: 'border-border bg-sunken',
}

const ICON_CLASSES: Record<AlertLevel, string> = {
  danger: 'rounded-full bg-danger text-accent-fg',
  warn: 'rounded-[3px] bg-warn text-accent-fg',
  info: 'rounded-full border border-border-strong text-text2',
}

const TITLE_CLASSES: Record<AlertLevel, string> = {
  danger: 'text-danger',
  warn: 'text-warn',
  info: 'text-text',
}

const ICON_GLYPH: Record<AlertLevel, string> = {
  danger: '!',
  warn: '△',
  info: 'i',
}

type AlertProps = {
  level: AlertLevel
  title: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}

export function Alert({ level, title, children, action, className }: AlertProps) {
  return (
    <div
      role={level === 'danger' ? 'alert' : 'status'}
      className={classNames(
        'flex items-start gap-2.5 rounded-card border px-3 py-2.5',
        CONTAINER_CLASSES[level],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={classNames(
          'mt-px inline-flex h-4 w-4 flex-none items-center justify-center text-label font-bold',
          ICON_CLASSES[level],
        )}
      >
        {ICON_GLYPH[level]}
      </span>
      <div>
        <div className={classNames('text-body font-semibold', TITLE_CLASSES[level])}>{title}</div>
        {children !== undefined && <div className="text-support text-text2">{children}</div>}
      </div>
      {action !== undefined && <div className="ml-auto flex-none">{action}</div>}
    </div>
  )
}
