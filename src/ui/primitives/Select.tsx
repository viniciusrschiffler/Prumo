import type { SelectHTMLAttributes } from 'react'
import { classNames } from './classNames'
import { FIELD_FOCUS_RING } from './focusRing'
import { FIELD_BASE_CLASSES } from './Input'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean
}

export function Select({ invalid = false, className, ...selectProps }: SelectProps) {
  return (
    <select
      {...selectProps}
      aria-invalid={invalid || undefined}
      className={classNames(
        FIELD_BASE_CLASSES,
        FIELD_FOCUS_RING,
        'h-7 px-1.5 text-body',
        invalid ? 'border-danger' : 'border-border-strong',
        className,
      )}
    />
  )
}
