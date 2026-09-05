import type { TextareaHTMLAttributes } from 'react'
import { classNames } from './classNames'
import { FIELD_FOCUS_RING } from './focusRing'
import { FIELD_TEXT_CLASSES, type FieldTextSize } from './fieldSize'
import { FIELD_BASE_CLASSES } from './Input'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean
  textSize?: FieldTextSize
}

export function Textarea({
  invalid = false,
  textSize = 'body',
  className,
  rows = 2,
  ...textareaProps
}: TextareaProps) {
  return (
    <textarea
      {...textareaProps}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={classNames(
        FIELD_BASE_CLASSES,
        FIELD_FOCUS_RING,
        FIELD_TEXT_CLASSES[textSize],
        'resize-none px-[9px] py-[7px]',
        invalid ? 'border-danger' : 'border-border-strong',
        className,
      )}
    />
  )
}
