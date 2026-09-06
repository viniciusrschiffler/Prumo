import type { ReactNode } from 'react'
import { classNames } from './classNames'

// O catálogo do sistema de design desenha o vazio com 26px de respiro e título de 13px, mas
// as telas o imprimem com 40 a 44px e título de 15px.
export type EmptyStateSize = 'default' | 'large'

const PADDING_CLASSES: Record<EmptyStateSize, string> = {
  default: 'p-[26px]',
  large: 'p-11',
}

const TITLE_CLASSES: Record<EmptyStateSize, string> = {
  default: 'text-body font-semibold',
  large: 'text-section-title',
}

const DESCRIPTION_CLASSES: Record<EmptyStateSize, string> = {
  default: 'max-w-[320px]',
  large: 'max-w-[340px]',
}

type EmptyStateProps = {
  title: string
  description?: ReactNode
  action?: ReactNode
  size?: EmptyStateSize
  className?: string
}

export function EmptyState({
  title,
  description,
  action,
  size = 'default',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={classNames(
        'grid justify-items-center gap-2 rounded-card border border-dashed border-border-strong bg-panel text-center',
        PADDING_CLASSES[size],
        className,
      )}
    >
      <div className="h-[34px] w-[34px] rounded-card border border-dashed border-border-strong bg-sunken" />
      <div className={TITLE_CLASSES[size]}>{title}</div>
      {description !== undefined && (
        <div
          className={classNames(
            'text-pretty text-support text-text2',
            DESCRIPTION_CLASSES[size],
          )}
        >
          {description}
        </div>
      )}
      {action !== undefined && <div className="mt-1">{action}</div>}
    </div>
  )
}
