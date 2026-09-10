import type { KeyboardEvent, MouseEvent } from 'react'
import type { NoteTreeNode } from '@/domain/notes/noteTree'
import { classNames } from '@/ui/primitives/classNames'
import { FOCUS_RING } from '@/ui/primitives/focusRing'
import { PhaseStripe } from '@/ui/primitives/PhaseStripe'
import { formatTreeMeta } from './noteLabels'

const INDENT_STEP_PX = 12
const BASE_PADDING_PX = 8

const OPEN_FOLDER_GLYPH = '▾'
const CLOSED_FOLDER_GLYPH = '▸'
const FILE_GLYPH = 'md'

type NoteTreeRowProps = {
  node: NoteTreeNode
  phaseColor: string | null
  isSelected: boolean
  isCollapsed: boolean
  onSelect: () => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
  onContextMenu: (event: MouseEvent<HTMLButtonElement>) => void
}

export function NoteTreeRow({
  node,
  phaseColor,
  isSelected,
  isCollapsed,
  onSelect,
  onKeyDown,
  onContextMenu,
}: NoteTreeRowProps) {
  const isFolder = node.kind === 'folder'

  return (
    <button
      type="button"
      role="treeitem"
      aria-selected={isSelected}
      aria-level={node.depth + 1}
      aria-expanded={isFolder ? !isCollapsed : undefined}
      title={node.path}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      onContextMenu={onContextMenu}
      style={{ paddingLeft: `${BASE_PADDING_PX + node.depth * INDENT_STEP_PX}px` }}
      className={classNames(
        'flex h-[26px] min-w-0 items-center gap-1.5 rounded-button pr-2 text-left hover:bg-neutral-soft',
        isSelected
          ? 'bg-accent-soft text-text shadow-[inset_2px_0_0_var(--accent)]'
          : 'text-text2',
        FOCUS_RING,
      )}
    >
      <span aria-hidden className="w-3 flex-none font-mono text-[9px] text-text3">
        {isFolder ? (isCollapsed ? CLOSED_FOLDER_GLYPH : OPEN_FOLDER_GLYPH) : FILE_GLYPH}
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
