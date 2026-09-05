import type { InputHTMLAttributes } from 'react'
import { classNames } from './classNames'
import { FIELD_FOCUS_RING } from './focusRing'

// Sem w-full: o campo vive dentro de um grid ou flex, que já o estica, e um w-full na base
// venceria qualquer largura que a tela precise passar — as telas têm campos de 52 e 180px.
export const FIELD_BASE_CLASSES =
  'rounded-button border bg-bg text-text placeholder:text-text3 disabled:cursor-not-allowed disabled:bg-sunken disabled:text-text3'

export const NUMERIC_FIELD_CLASSES = 'font-mono text-support tabular-nums'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  numeric?: boolean
  invalid?: boolean
}

export function Input({ numeric = false, invalid = false, className, ...inputProps }: InputProps) {
  return (
    <input
      {...inputProps}
      aria-invalid={invalid || undefined}
      className={classNames(
        FIELD_BASE_CLASSES,
        FIELD_FOCUS_RING,
        'h-7 px-[9px]',
        numeric ? NUMERIC_FIELD_CLASSES : 'text-body',
        invalid ? 'border-danger' : 'border-border-strong',
        className,
      )}
    />
  )
}
