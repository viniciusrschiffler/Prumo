import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { classNames } from '@/ui/primitives/classNames'
import { FOCUS_RING } from '@/ui/primitives/focusRing'

const MENU_WIDTH_PX = 184
const MENU_PADDING_PX = 8
const MENU_ITEM_HEIGHT_PX = 26
const EDGE_GAP_PX = 8

export type NoteContextAction = {
  id: string
  label: string
  isDanger?: boolean
  onSelect: () => void
}

export type NoteContextAnchor = {
  x: number
  y: number
}

type NoteTreeContextMenuProps = {
  anchor: NoteContextAnchor
  actions: readonly NoteContextAction[]
  onClose: () => void
}

function clamp(value: number, size: number, limit: number): number {
  return Math.min(value, Math.max(EDGE_GAP_PX, limit - size - EDGE_GAP_PX))
}

export function NoteTreeContextMenu({ anchor, actions, onClose }: NoteTreeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    menuRef.current?.querySelector('button')?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const height = actions.length * MENU_ITEM_HEIGHT_PX + MENU_PADDING_PX

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0" onMouseDown={onClose} aria-hidden />
      <div
        ref={menuRef}
        role="menu"
        aria-label="Ações da árvore de notas"
        style={{
          left: clamp(anchor.x, MENU_WIDTH_PX, window.innerWidth),
          top: clamp(anchor.y, height, window.innerHeight),
          width: MENU_WIDTH_PX,
        }}
        className="absolute grid gap-px rounded-button border border-border-strong bg-panel p-1 shadow-popover"
      >
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            role="menuitem"
            onClick={() => {
              onClose()
              action.onSelect()
            }}
            className={classNames(
              'flex h-[26px] items-center rounded-[5px] px-2 text-left text-support hover:bg-neutral-soft',
              action.isDanger === true ? 'text-danger' : 'text-text2 hover:text-text',
              FOCUS_RING,
            )}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>,
    document.body,
  )
}
