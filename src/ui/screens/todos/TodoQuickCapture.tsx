import type { QuickCapture, QuickCaptureContext } from '@/domain/todos/quickCapture'
import type { TodoView } from '@/domain/todos/todoView'
import { KeyHint } from '@/ui/primitives/KeyHint'
import { QuickCaptureField } from '@/ui/primitives/QuickCaptureField'

const PLACEHOLDER = 'Captura rápida — use #tag, @projeto, !p0 e datas como “sex”, “12/09”'

type TodoQuickCaptureProps = {
  context: QuickCaptureContext
  view: TodoView
  onCapture: (capture: QuickCapture) => void
}

// No quadro o "@" perde o lugar para o arrasto, que já troca o projeto quando é por ele que
// as colunas se dividem; a dica passa a falar do que a visão em foco realmente faz.
export function TodoQuickCapture({ context, view, onCapture }: TodoQuickCaptureProps) {
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
        {view === 'board' && (
          <>
            arraste o card entre colunas
            <span aria-hidden="true">·</span>
          </>
        )}
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
