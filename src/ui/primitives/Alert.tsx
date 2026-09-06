import type { ReactNode } from 'react'
import { AlertIcon, type AlertLevel } from './AlertIcon'
import { classNames } from './classNames'

export type { AlertLevel }

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

const TITLE_CLASSES: Record<AlertLevel, string> = {
  danger: 'text-danger',
  warn: 'text-warn',
  ok: 'text-text',
  info: 'text-text',
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
      <AlertIcon level={level} className="mt-px" />
      <div>
        <div className={classNames('text-body font-semibold', TITLE_CLASSES[level])}>{title}</div>
        {children !== undefined && <div className="text-support text-text2">{children}</div>}
      </div>
      {action !== undefined && <div className="ml-auto flex-none">{action}</div>}
    </div>
  )
}
