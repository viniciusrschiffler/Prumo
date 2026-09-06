import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import type { EntityId } from '@/domain/schemas/primitives'
import { toOffsetDays } from '@/domain/timeline/timelineGeometry'
import type { ScheduleEditMode } from '@/domain/timeline/timelineSchedule'
import type { TimelineWindow } from '@/domain/timeline/timelineWindow'

export type PendingScheduleEdit = {
  taskId: EntityId
  mode: ScheduleEditMode
  offsetDays: number
}

type CommitSchedule = (taskId: EntityId, mode: ScheduleEditMode, offsetDays: number) => void

// O ponteiro grava ao soltar e o teclado grava no Enter, mas os dois montam a mesma alteração
// pendente: escrever no banco a cada tecla gravaria um evento de replanejamento por seta.
export function useTimelineSchedule(window: TimelineWindow | null, commit: CommitSchedule) {
  const [pending, setPendingState] = useState<PendingScheduleEdit | null>(null)
  const pendingRef = useRef<PendingScheduleEdit | null>(null)
  const latest = useRef({ window, commit })

  useEffect(() => {
    latest.current = { window, commit }
  })

  const setPending = useCallback((next: PendingScheduleEdit | null) => {
    pendingRef.current = next
    setPendingState(next)
  }, [])

  const cancel = useCallback(() => setPending(null), [setPending])

  const beginDrag = useCallback(
    (event: PointerEvent<HTMLElement>, taskId: EntityId, mode: ScheduleEditMode) => {
      const track = event.currentTarget.closest('[data-timeline-track]')
      const trackWidth = track?.getBoundingClientRect().width ?? 0

      if (latest.current.window === null || trackWidth === 0) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const startX = event.clientX
      let offsetDays = 0

      const onMove = (moveEvent: globalThis.PointerEvent) => {
        const currentWindow = latest.current.window

        if (currentWindow === null) {
          return
        }

        offsetDays = toOffsetDays(currentWindow, (moveEvent.clientX - startX) / trackWidth)
        setPending({ taskId, mode, offsetDays })
      }

      const onUp = () => {
        globalThis.removeEventListener('pointermove', onMove)
        globalThis.removeEventListener('pointerup', onUp)
        setPending(null)

        if (offsetDays !== 0) {
          latest.current.commit(taskId, mode, offsetDays)
        }
      }

      globalThis.addEventListener('pointermove', onMove)
      globalThis.addEventListener('pointerup', onUp)
    },
    [setPending],
  )

  const nudge = useCallback(
    (taskId: EntityId, mode: ScheduleEditMode, days: number) => {
      const current = pendingRef.current
      const base = current?.taskId === taskId && current.mode === mode ? current.offsetDays : 0

      setPending({ taskId, mode, offsetDays: base + days })
    },
    [setPending],
  )

  const confirm = useCallback(() => {
    const current = pendingRef.current

    setPending(null)

    if (current !== null && current.offsetDays !== 0) {
      latest.current.commit(current.taskId, current.mode, current.offsetDays)
    }
  }, [setPending])

  return { pending, beginDrag, nudge, confirm, cancel }
}

export function readPendingOffset(
  pending: PendingScheduleEdit | null,
  taskId: EntityId,
): PendingScheduleEdit | null {
  return pending?.taskId === taskId ? pending : null
}
