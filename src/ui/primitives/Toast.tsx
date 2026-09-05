import type { ReactNode } from 'react'
import { classNames } from './classNames'

// Não existe toast no Sistema de Design; montado só com tokens, para validação visual.

export type ToastTone = 'ok' | 'danger'

const DOT_CLASSES: Record<ToastTone, string> = {
  ok: 'bg-ok',
  danger: 'bg-danger',
}

type ToastProps = {
  tone?: ToastTone
  children: ReactNode
  action?: ReactNode
  className?: string
}

export function Toast({ tone = 'ok', children, action, className }: ToastProps) {
  return (
    <div
      role="status"
      className={classNames(
        'inline-flex items-center gap-2 rounded-card border border-border-strong bg-raised px-3 py-2 text-support text-text shadow-modal',
        className,
      )}
    >
      <span className={classNames('h-1.5 w-1.5 flex-none rounded-full', DOT_CLASSES[tone])} />
      {children}
      {action !== undefined && <span className="ml-1">{action}</span>}
    </div>
  )
}
