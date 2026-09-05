import type { CSSProperties, ReactNode } from 'react'
import { classNames } from './classNames'

export type TableDensity = 'compact' | 'comfortable'
export type TableVariant = 'card' | 'flush'

const DENSITY_ROW_PADDING: Record<TableDensity, string> = {
  compact: '5px',
  comfortable: '9px',
}

const VARIANT_CLASSES: Record<TableVariant, string> = {
  card: 'overflow-hidden rounded-card border border-border bg-panel',
  flush: '',
}

type TableProps = {
  density?: TableDensity
  variant?: TableVariant
  label?: string
  children: ReactNode
  className?: string
}

export function Table({
  density = 'comfortable',
  variant = 'card',
  label,
  children,
  className,
}: TableProps) {
  return (
    <div
      style={{ '--rowpad': DENSITY_ROW_PADDING[density] } as CSSProperties}
      className={classNames(VARIANT_CLASSES[variant], className)}
    >
      <table aria-label={label} className="w-full border-collapse text-body">
        {children}
      </table>
    </div>
  )
}
