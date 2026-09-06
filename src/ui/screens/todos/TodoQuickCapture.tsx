import { useState, type KeyboardEvent } from 'react'
import type { QuickCapture, QuickCaptureContext } from '@/domain/todos/quickCapture'
import { parseQuickCapture } from '@/domain/todos/quickCapture'
import { classNames } from '@/ui/primitives/classNames'
import { FIELD_FOCUS_RING } from '@/ui/primitives/focusRing'
import { KeyHint } from '@/ui/primitives/KeyHint'

const PLACEHOLDER = 'Captura rápida — use #tag, @projeto, !p0 e datas como “sex”, “12/09”'

type TodoQuickCaptureProps = {
  context: QuickCaptureContext
  onCapture: (capture: QuickCapture) => void
}

export function TodoQuickCapture({ context, onCapture }: TodoQuickCaptureProps) {
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
    <div className="flex items-center gap-2">
      <div className="relative flex flex-1 items-center">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 font-mono text-support text-accent"
        >
          +
        </span>
        <input
          value={text}
          aria-label="Captura rápida"
          placeholder={PLACEHOLDER}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          className={classNames(
            'h-8 w-full min-w-0 rounded-button border border-border-strong bg-bg text-body text-text placeholder:text-text3',
            'pl-[26px] pr-[78px]',
            FIELD_FOCUS_RING,
          )}
        />
        <span className="pointer-events-none absolute right-2">
          <KeyHint keys="mod+enter" variant="muted" />
        </span>
      </div>
      <span className="flex items-center gap-1 whitespace-nowrap text-label font-normal tracking-normal text-text3">
        marcar
        <KeyHint keys="space" variant="hint" />
        <span aria-hidden="true">·</span>
        adiar
        <KeyHint keys="s" variant="hint" />
        <span aria-hidden="true">·</span>
        vincular projeto
        <KeyHint keys="@" variant="hint" />
      </span>
    </div>
  )
}
