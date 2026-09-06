import type { ReactNode } from 'react'
import { classNames } from './classNames'

export type AlertLevel = 'danger' | 'warn' | 'ok' | 'info'

// O painel lateral da Capacidade desenha o mesmo aviso sobre o painel branco, com a borda
// neutra: a cor do nível fica só no ícone. É variação de aparência, então é prop.
export type AlertSurface = 'tinted' | 'plain'

const CONTAINER_CLASSES: Record<AlertLevel, string> = {
  danger: 'border-danger bg-danger-soft',
  warn: 'border-warn bg-warn-soft',
  ok: 'border-ok bg-ok-soft',
  info: 'border-border bg-sunken',
}

const PLAIN_CONTAINER_CLASSES = 'border-border bg-panel'

const ICON_CLASSES: Record<AlertLevel, string> = {
  danger: 'rounded-full bg-danger text-accent-fg',
  warn: 'rounded-[3px] bg-warn text-accent-fg',
  ok: 'rounded-full bg-ok text-accent-fg',
  info: 'rounded-full border border-border-strong text-text2',
}

const TITLE_CLASSES: Record<AlertLevel, string> = {
  danger: 'text-danger',
  warn: 'text-warn',
  ok: 'text-text',
  info: 'text-text',
}

const ICON_GLYPH: Record<AlertLevel, string> = {
  danger: '!',
  warn: '△',
  ok: '✓',
  info: 'i',
}

type AlertProps = {
  level: AlertLevel
  surface?: AlertSurface
  title: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}

export function Alert({
  level,
  surface = 'tinted',
  title,
  children,
  action,
  className,
}: AlertProps) {
  return (
    <div
      role={level === 'danger' ? 'alert' : 'status'}
      className={classNames(
        'flex items-start gap-2.5 rounded-card border px-3 py-2.5',
        surface === 'plain' ? PLAIN_CONTAINER_CLASSES : CONTAINER_CLASSES[level],
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
