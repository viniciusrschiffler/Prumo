import { useState, type DragEvent, type KeyboardEvent } from 'react'

export type ListReorder = {
  draggingIndex: number | null
  targetIndex: number | null
  getHandleProps: (index: number) => {
    draggable: true
    onDragStart: (event: DragEvent) => void
    onDragEnd: () => void
    onKeyDown: (event: KeyboardEvent) => void
  }
  getRowProps: (index: number) => {
    onDragOver: (event: DragEvent) => void
    onDrop: (event: DragEvent) => void
  }
}

// O arrasto nativo exige dado no dataTransfer para iniciar no Firefox e no WebView2.
const DRAG_MIME_TYPE = 'text/plain'

export function useListReorder(
  itemCount: number,
  onReorder: (fromIndex: number, toIndex: number) => void,
): ListReorder {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [targetIndex, setTargetIndex] = useState<number | null>(null)

  function finishDrag() {
    setDraggingIndex(null)
    setTargetIndex(null)
  }

  function moveByKeyboard(index: number, step: number) {
    const target = index + step

    if (target < 0 || target >= itemCount) {
      return
    }

    onReorder(index, target)
  }

  return {
    draggingIndex,
    targetIndex,
    getHandleProps: (index) => ({
      draggable: true,
      onDragStart: (event) => {
        event.dataTransfer.setData(DRAG_MIME_TYPE, String(index))
        event.dataTransfer.effectAllowed = 'move'
        setDraggingIndex(index)
      },
      onDragEnd: finishDrag,
      onKeyDown: (event) => {
        if (!event.altKey) {
          return
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault()
          moveByKeyboard(index, -1)
          return
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault()
          moveByKeyboard(index, 1)
        }
      },
    }),
    getRowProps: (index) => ({
      onDragOver: (event) => {
        if (draggingIndex === null) {
          return
        }

        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        setTargetIndex(index)
      },
      onDrop: (event) => {
        event.preventDefault()

        if (draggingIndex !== null && draggingIndex !== index) {
          onReorder(draggingIndex, index)
        }

        finishDrag()
      },
    }),
  }
}
