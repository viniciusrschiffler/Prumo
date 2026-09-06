import type { ReactNode } from 'react'

type PanelSectionProps = {
  title: string
  note?: ReactNode
  children: ReactNode
}

export function PanelSection({ title, note, children }: PanelSectionProps) {
  return (
    <section className="grid gap-2">
      <div className="flex items-center gap-2">
        <h2 className="text-label uppercase text-text2">{title}</h2>
        {note !== undefined && <span className="ml-auto">{note}</span>}
      </div>
      {children}
    </section>
  )
}
