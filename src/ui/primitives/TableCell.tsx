import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { classNames } from './classNames'

type TableHeaderCellProps = ThHTMLAttributes<HTMLTableCellElement> & {
  numeric?: boolean
  sticky?: boolean
  children?: ReactNode
}

export function TableHeaderCell({
  numeric = false,
  sticky = false,
  children,
  className,
  ...cellProps
}: TableHeaderCellProps) {
  return (
    <th
      {...cellProps}
      className={classNames(
        'border-b border-border px-2.5 py-[7px] text-column uppercase text-text2',
        numeric ? 'text-right' : 'text-left',
        sticky ? 'sticky top-0 z-10 bg-sunken' : '',
        className,
      )}
    >
      {children}
    </th>
  )
}

type TableCellProps = TdHTMLAttributes<HTMLTableCellElement> & {
  numeric?: boolean
  indented?: boolean
  children?: ReactNode
}

export function TableCell({
  numeric = false,
  indented = false,
  children,
  className,
  ...cellProps
}: TableCellProps) {
  return (
    <td
      {...cellProps}
      className={classNames(
        'border-b border-border px-2.5 py-[var(--rowpad)]',
        numeric ? 'text-right font-mono text-support tabular-nums' : '',
        indented ? 'pl-9' : '',
        className,
      )}
    >
      {children}
    </td>
  )
}
