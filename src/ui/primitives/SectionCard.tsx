import type { ReactNode } from 'react'
import { classNames } from './classNames'

export type SectionCardTone = 'default' | 'danger'

type SectionCardProps = {
  title: string
  note?: ReactNode
  action?: ReactNode
  tone?: SectionCardTone
  id?: string
  children: ReactNode
  className?: string
}

export function SectionCard({
  title,
  note,
  action,
  tone = 'default',
  id,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      id={id}
      aria-label={title}
      className={classNames(
        'overflow-hidden rounded-card border bg-panel',
        tone === 'danger' ? 'border-danger' : 'border-border',
        className,
      )}
    >
      <div className="flex items-baseline gap-[9px] border-b border-border px-3.5 py-3">
        <h2
          className={classNames('text-body font-semibold', tone === 'danger' ? 'text-danger' : '')}
        >
          {title}
        </h2>
        {note !== undefined && <span className="text-label font-normal tracking-normal text-text3">{note}</span>}
        {action !== undefined && <div className="ml-auto flex items-center gap-2">{action}</div>}
      </div>
      {children}
    </section>
  )
}
