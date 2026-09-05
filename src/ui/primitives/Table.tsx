import type { CSSProperties, ReactNode } from 'react'
import { classNames } from './classNames'

export type TableDensity = 'compact' | 'comfortable'

const DENSITY_ROW_PADDING: Record<TableDensity, string> = {
  compact: '5px',
  comfortable: '9px',
}

type TableProps = {
  density?: TableDensity
  children: ReactNode
  className?: string
}

export function Table({ density = 'comfortable', children, className }: TableProps) {
  return (
    <div
      style={{ '--rowpad': DENSITY_ROW_PADDING[density] } as CSSProperties}
      className={classNames(
        'overflow-hidden rounded-card border border-border bg-panel',
        className,
      )}
    >
      <table className="w-full border-collapse text-body">{children}</table>
    </div>
  )
}
