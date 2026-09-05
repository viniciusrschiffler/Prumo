import type { ReactNode } from 'react'
import { classNames } from './classNames'

type StaticFieldProps = {
  children: ReactNode
  className?: string
}

export function StaticField({ children, className }: StaticFieldProps) {
  return (
    <div
      className={classNames(
        'flex h-7 items-center rounded-button border border-border bg-sunken px-[9px] text-support text-text2',
        className,
      )}
    >
      {children}
    </div>
  )
}
