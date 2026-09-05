import type { ReactNode } from 'react'
import { classNames } from './classNames'

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={classNames(
        'grid justify-items-center gap-2 rounded-card border border-dashed border-border-strong bg-panel p-[26px] text-center',
        className,
      )}
    >
      <div className="h-[34px] w-[34px] rounded-card border border-dashed border-border-strong bg-sunken" />
      <div className="text-body font-semibold">{title}</div>
      {description !== undefined && (
        <div className="max-w-[320px] text-pretty text-support text-text2">{description}</div>
      )}
      {action !== undefined && <div className="mt-1">{action}</div>}
    </div>
  )
}
