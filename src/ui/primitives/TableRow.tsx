import type { HTMLAttributes, ReactNode } from 'react'
import { classNames } from './classNames'

type TableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  selected?: boolean
  child?: boolean
  children: ReactNode
}

export function TableRow({
  selected = false,
  child = false,
  children,
  className,
  ...rowProps
}: TableRowProps) {
  return (
    <tr
      {...rowProps}
      aria-selected={selected || undefined}
      className={classNames(
        selected ? 'bg-accent-soft' : child ? 'bg-sunken' : 'hover:bg-sunken',
        className,
      )}
    >
      {children}
    </tr>
  )
}

type TableHeaderRowProps = {
  children: ReactNode
}

export function TableHeaderRow({ children }: TableHeaderRowProps) {
  return (
    <thead>
      <tr className="bg-sunken">{children}</tr>
    </thead>
  )
}
