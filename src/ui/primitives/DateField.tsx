import { useRef } from 'react'
import { formatIsoDate, maskDisplayDate, parseDisplayDate } from '@/domain/format/displayDate'
import { classNames } from './classNames'
import type { FieldSize } from './fieldSize'
import { FOCUS_RING } from './focusRing'
import { Input } from './Input'

const PLACEHOLDER = 'dd/mm/aaaa'
const PICKER_LABEL = 'Escolher no calendário'

type DateFieldProps = {
  id?: string
  value: string
  onChange: (text: string) => void
  fieldSize?: FieldSize
  invalid?: boolean
  autoFocus?: boolean
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
      <rect
        x="2.5"
        y="3.5"
        width="11"
        height="10"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <line x1="2.5" y1="6.5" x2="13.5" y2="6.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="5.5" y1="2" x2="5.5" y2="4.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="10.5" y1="2" x2="10.5" y2="4.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

// O campo continua sendo texto em dd/mm/aaaa, como o design o desenha: o input nativo existe
// só para abrir o calendário do sistema. Ele fica transparente atrás do botão, e não com
// display none, porque o showPicker exige um elemento de fato renderizado.
export function DateField({
  id,
  value,
  onChange,
  fieldSize = 'default',
  invalid = false,
  autoFocus = false,
}: DateFieldProps) {
  const pickerRef = useRef<HTMLInputElement>(null)

  return (
    <div className="relative grid">
      <Input
        id={id}
        numeric
        autoFocus={autoFocus}
        autoComplete="off"
        inputMode="numeric"
        fieldSize={fieldSize}
        value={value}
        placeholder={PLACEHOLDER}
        invalid={invalid}
        onChange={(event) => onChange(maskDisplayDate(event.target.value))}
        className="pr-7"
      />

      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={parseDisplayDate(value) ?? ''}
        onChange={(event) =>
          onChange(event.target.value === '' ? '' : formatIsoDate(event.target.value))
        }
        className="pointer-events-none absolute bottom-0 right-2 h-px w-px opacity-0"
      />

      <button
        type="button"
        title={PICKER_LABEL}
        aria-label={PICKER_LABEL}
        onClick={() => pickerRef.current?.showPicker()}
        className={classNames(
          'absolute right-0 top-0 flex h-full w-7 items-center justify-center rounded-r-button text-text3 hover:text-text',
          FOCUS_RING,
        )}
      >
        <CalendarIcon />
      </button>
    </div>
  )
}
