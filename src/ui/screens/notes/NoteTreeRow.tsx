import type { KeyboardEvent } from 'react'
import type { NoteTreeNode } from '@/domain/notes/noteTree'
import { classNames } from '@/ui/primitives/classNames'
import { FOCUS_RING } from '@/ui/primitives/focusRing'
import { PhaseStripe } from '@/ui/primitives/PhaseStripe'
import { formatTreeMeta } from './noteLabels'

const INDENT_STEP_PX = 12
const BASE_PADDING_PX = 8

const FOLDER_GLYPH = '▾'
const FILE_GLYPH = 'md'

type NoteTreeRowProps = {
  node: NoteTreeNode
  phaseColor: string | null
  isSelected: boolean
  onSelect: () => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
}

export function NoteTreeRow({
  node,
  phaseColor,
  isSelected,
  onSelect,
  onKeyDown,
}: NoteTreeRowProps) {
  const isFolder = node.kind === 'folder'

  return (
    <button
      type="button"
      role="treeitem"
      aria-selected={isSelected}
      aria-level={node.depth + 1}
      aria-expanded={isFolder ? true : undefined}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      style={{ paddingLeft: `${BASE_PADDING_PX + node.depth * INDENT_STEP_PX}px` }}
      className={classNames(
        'flex h-[26px] items-center gap-1.5 rounded-button pr-2 text-left hover:bg-neutral-soft',
        isSelected
          ? 'bg-accent-soft text-text shadow-[inset_2px_0_0_var(--accent)]'
          : 'text-text2',
        FOCUS_RING,
      )}
    >
      <span aria-hidden className="w-3 flex-none font-mono text-[9px] text-text3">
        {isFolder ? FOLDER_GLYPH : FILE_GLYPH}
      </span>
      {phaseColor !== null && <PhaseStripe color={phaseColor} size="small" />}
      <span
        className={classNames(
          'truncate text-support',
          isFolder ? 'font-semibold text-text' : '',
        )}
      >
        {node.name}
      </span>
      <span className="ml-auto pl-2 font-mono text-micro text-text3">
        {formatTreeMeta(node)}
      </span>
    </button>
  )
}
