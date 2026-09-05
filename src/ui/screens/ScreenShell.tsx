import type { ReactNode } from 'react'
import { classNames } from '@/ui/primitives/classNames'

type ScreenShellProps = {
  title: string
  subhead: string
  actions?: ReactNode
  contentClassName?: string
  children?: ReactNode
}

export function ScreenShell({
  title,
  subhead,
  actions,
  contentClassName,
  children,
}: ScreenShellProps) {
  return (
    <section className="flex h-full flex-col overflow-hidden">
      <header className="flex items-center gap-3.5 border-b border-border bg-panel px-5 py-3">
        <div className="grid">
          <h1 className="text-entity-title">{title}</h1>
          <span className="font-mono text-meta tabular-nums text-text3">{subhead}</span>
        </div>
        {actions !== undefined && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </header>
      <div className={classNames('flex-1 overflow-auto', contentClassName ?? 'px-5 py-4')}>
        {children}
      </div>
    </section>
  )
}
