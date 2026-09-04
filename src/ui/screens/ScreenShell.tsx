import type { ReactNode } from 'react'

type ScreenShellProps = {
  title: string
  subhead: string
  children?: ReactNode
}

export function ScreenShell({ title, subhead, children }: ScreenShellProps) {
  return (
    <section className="flex h-full flex-col overflow-hidden">
      <header className="flex items-baseline gap-3 border-b border-border px-7 py-3.5">
        <h1 className="text-entity-title">{title}</h1>
        <span className="text-support text-text3">{subhead}</span>
      </header>
      <div className="flex-1 overflow-auto px-7 py-6">{children}</div>
    </section>
  )
}
