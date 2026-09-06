import { useState, type KeyboardEvent } from 'react'
import type { QuickCapture, QuickCaptureContext } from '@/domain/todos/quickCapture'
import { parseQuickCapture } from '@/domain/todos/quickCapture'
import { classNames } from './classNames'
import { FIELD_SIZE_CLASSES, type FieldSize } from './fieldSize'
import { FIELD_FOCUS_RING } from './focusRing'
import { KeyHint } from './KeyHint'

// A TodoList marca o campo com um "+" e a tela de Hoje não, e cada forma tem o respiro que o
// seu .dc.html desenha: é variação de aparência, então é prop e não className.
export type QuickCaptureVariant = 'prefixed' | 'plain'

const PADDING_CLASSES: Record<QuickCaptureVariant, string> = {
  prefixed: 'pl-[26px] pr-[78px]',
  plain: 'pl-2.5 pr-[66px]',
}

const SIZE_BY_VARIANT: Record<QuickCaptureVariant, FieldSize> = {
  prefixed: 'large',
  plain: 'medium',
}

type QuickCaptureFieldProps = {
  context: QuickCaptureContext
  onCapture: (capture: QuickCapture) => void
  placeholder: string
  variant?: QuickCaptureVariant
  className?: string
}

export function QuickCaptureField({
  context,
  onCapture,
  placeholder,
  variant = 'plain',
  className,
}: QuickCaptureFieldProps) {
  const [text, setText] = useState('')

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') {
      return
    }

    const capture = parseQuickCapture(text, context)

    if (capture.title.trim() === '') {
      return
    }

    event.preventDefault()
    onCapture(capture)
    setText('')
  }

  return (
    <div className={classNames('relative flex items-center', className)}>
      {variant === 'prefixed' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 font-mono text-support text-accent"
        >
          +
        </span>
      )}
      <input
        name="quick-capture"
        value={text}
        aria-label="Captura rápida"
        placeholder={placeholder}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        className={classNames(
          'w-full min-w-0 rounded-button border border-border-strong bg-bg text-body text-text placeholder:text-text3',
          FIELD_SIZE_CLASSES[SIZE_BY_VARIANT[variant]],
          PADDING_CLASSES[variant],
          FIELD_FOCUS_RING,
        )}
      />
      <span className="pointer-events-none absolute right-2">
        <KeyHint keys="mod+enter" variant="muted" />
      </span>
    </div>
  )
}
