import type { InputHTMLAttributes } from 'react'
import { classNames } from './classNames'
import {
  FIELD_SIZE_CLASSES,
  FIELD_TEXT_CLASSES,
  type FieldSize,
  type FieldTextSize,
} from './fieldSize'
import { FIELD_FOCUS_RING } from './focusRing'

// Sem w-full: o campo vive dentro de um grid ou flex, que já o estica, e um w-full na base
// venceria qualquer largura que a tela precise passar — as telas têm campos de 52 e 180px.
// O min-w-0 é outra coisa: sem ele o input não encolhe abaixo da largura intrínseca do
// atributo size e vaza da trilha de grid estreita, como a coluna de data de 130px do modal.
export const FIELD_BASE_CLASSES =
  'min-w-0 rounded-button border bg-bg text-text placeholder:text-text3 disabled:cursor-not-allowed disabled:bg-sunken disabled:text-text3'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  numeric?: boolean
  invalid?: boolean
  fieldSize?: FieldSize
  textSize?: FieldTextSize
}

export function Input({
  numeric = false,
  invalid = false,
  fieldSize = 'default',
  textSize,
  className,
  ...inputProps
}: InputProps) {
  return (
    <input
      {...inputProps}
      aria-invalid={invalid || undefined}
      className={classNames(
        FIELD_BASE_CLASSES,
        FIELD_FOCUS_RING,
        FIELD_SIZE_CLASSES[fieldSize],
        FIELD_TEXT_CLASSES[textSize ?? (numeric ? 'support' : 'body')],
        numeric ? 'font-mono tabular-nums' : '',
        'px-[9px]',
        invalid ? 'border-danger' : 'border-border-strong',
        className,
      )}
    />
  )
}
