import type { SelectHTMLAttributes } from 'react'
import { classNames } from './classNames'
import {
  FIELD_SIZE_CLASSES,
  FIELD_TEXT_CLASSES,
  type FieldSize,
  type FieldTextSize,
} from './fieldSize'
import { FIELD_FOCUS_RING } from './focusRing'
import { FIELD_BASE_CLASSES } from './Input'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean
  fieldSize?: FieldSize
  textSize?: FieldTextSize
}

export function Select({
  invalid = false,
  fieldSize = 'default',
  textSize = 'body',
  className,
  ...selectProps
}: SelectProps) {
  return (
    <select
      {...selectProps}
      aria-invalid={invalid || undefined}
      className={classNames(
        FIELD_BASE_CLASSES,
        FIELD_FOCUS_RING,
        FIELD_SIZE_CLASSES[fieldSize],
        FIELD_TEXT_CLASSES[textSize],
        'px-1.5',
        invalid ? 'border-danger' : 'border-border-strong',
        className,
      )}
    />
  )
}
