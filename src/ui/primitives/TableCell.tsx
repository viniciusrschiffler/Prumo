import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { classNames } from './classNames'

type TableHeaderCellProps = ThHTMLAttributes<HTMLTableCellElement> & {
  numeric?: boolean
  children?: ReactNode
}

export function TableHeaderCell({
  numeric = false,
  children,
  className,
  ...cellProps
}: TableHeaderCellProps) {
  return (
    <th
      {...cellProps}
      className={classNames(
        'border-b border-border px-2.5 py-[7px] text-label uppercase tracking-[0.06em] text-text2',
        numeric ? 'text-right' : 'text-left',
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
