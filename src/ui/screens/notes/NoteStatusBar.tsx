import type { NoteSaveStatus } from '@/app/stores/useNotesStore'
import type { IsoDateTime } from '@/domain/schemas/primitives'
import { classNames } from '@/ui/primitives/classNames'
import { KeyHint } from '@/ui/primitives/KeyHint'
import { formatSaveState } from './noteLabels'

const SAVE_TONE_CLASSES: Record<NoteSaveStatus, string> = {
  idle: 'text-text3',
  dirty: 'text-warn',
  saving: 'text-text2',
  saved: 'text-ok',
  error: 'text-danger',
}

const SAVE_DOT_CLASSES: Record<NoteSaveStatus, string> = {
  idle: 'bg-text3',
  dirty: 'bg-warn',
  saving: 'bg-text2',
  saved: 'bg-ok',
  error: 'bg-danger',
}

type NoteStatusBarProps = {
  stats: string
  saveStatus: NoteSaveStatus
  savedAt: IsoDateTime | null
}

export function NoteStatusBar({ stats, saveStatus, savedAt }: NoteStatusBarProps) {
  return (
    <footer className="flex flex-none items-center gap-4 border-t border-border bg-panel px-[18px] py-2 text-label font-normal tracking-normal text-text2">
      <span className="font-mono tabular-nums">{stats}</span>
      <span className="flex items-center gap-1.5 text-text3">
        negrito <KeyHint keys="mod+b" variant="hint" /> · link{' '}
        <KeyHint keys="mod+l" variant="hint" /> · preview{' '}
        <KeyHint keys="mod+p" variant="hint" />
      </span>
      <span
        role="status"
        className={classNames(
          'ml-auto inline-flex items-center gap-1.5 font-mono',
          SAVE_TONE_CLASSES[saveStatus],
        )}
      >
        <span
          aria-hidden
          className={classNames('h-1.5 w-1.5 rounded-full', SAVE_DOT_CLASSES[saveStatus])}
        />
        {formatSaveState(saveStatus, savedAt)}
      </span>
    </footer>
  )
}
