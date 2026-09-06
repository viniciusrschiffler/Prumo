import type { QuickCapture, QuickCaptureContext } from '@/domain/todos/quickCapture'
import { KeyHint } from '@/ui/primitives/KeyHint'
import { QuickCaptureField } from '@/ui/primitives/QuickCaptureField'

const PLACEHOLDER = 'Captura rápida — use #tag, @projeto, !p0 e datas como “sex”, “12/09”'

type TodoQuickCaptureProps = {
  context: QuickCaptureContext
  onCapture: (capture: QuickCapture) => void
}

export function TodoQuickCapture({ context, onCapture }: TodoQuickCaptureProps) {
  return (
    <div className="flex items-center gap-2">
      <QuickCaptureField
        context={context}
        onCapture={onCapture}
        placeholder={PLACEHOLDER}
        variant="prefixed"
        className="flex-1"
      />
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
