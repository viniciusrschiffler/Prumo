import { forwardRef } from 'react'
import { classNames } from '@/ui/primitives/classNames'

const FOLDER_HINT = 'Selecione um arquivo .md para editar.'

type NoteEditorPaneProps = {
  content: string
  isEditable: boolean
  onChange: (content: string) => void
  onBlur: () => void
  className?: string
}

export const NoteEditorPane = forwardRef<HTMLTextAreaElement, NoteEditorPaneProps>(
  function NoteEditorPane({ content, isEditable, onChange, onBlur, className }, ref) {
    if (!isEditable) {
      return (
        <div className={classNames('overflow-auto bg-bg', className)}>
          <div className="max-w-[760px] px-[26px] pb-10 pt-[22px] font-mono text-body leading-[1.75] text-text3">
            {FOLDER_HINT}
          </div>
        </div>
      )
    }

    return (
      <div className={classNames('flex overflow-hidden bg-bg', className)}>
        <textarea
          ref={ref}
          value={content}
          spellCheck={false}
          aria-label="Conteúdo da nota"
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className="h-full w-full max-w-[760px] resize-none border-0 bg-transparent px-[26px] pb-10 pt-[22px] font-mono text-body leading-[1.75] text-text outline-none"
        />
      </div>
    )
  },
)
