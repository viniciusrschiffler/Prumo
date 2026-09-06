import { useEffect, useMemo, useRef, useState } from 'react'
import { todayIsoDate } from '@/app/clock'
import { useDatabaseStore } from '@/app/stores/useDatabaseStore'
import { useProjectsStore } from '@/app/stores/useProjectsStore'
import { useSettingsStore } from '@/app/stores/useSettingsStore'
import type { SidebarContextItem } from '@/app/stores/useSidebarContextStore'
import { useToastStore } from '@/app/stores/useToastStore'
import { toPublicMessage } from '@/domain/errors/PrumoError'
import type { EntityId } from '@/domain/schemas/primitives'
import { toMarkerPercent } from '@/domain/timeline/timelineGeometry'
import { applyScheduleEdit, type ScheduleEditMode } from '@/domain/timeline/timelineSchedule'
import {
  buildTimelineRows,
  collectRowPeriods,
  countOverloads,
  countVisibleItems,
  TIMELINE_GROUPINGS,
  type TimelineGrouping,
} from '@/domain/timeline/timelineRows'
import { buildTimelineWindow, TIMELINE_ZOOMS, type TimelineZoom } from '@/domain/timeline/timelineWindow'
import { useSidebarContext } from '@/ui/layout/useSidebarContext'
import { Alert } from '@/ui/primitives/Alert'
import { Button } from '@/ui/primitives/Button'
import { EmptyState } from '@/ui/primitives/EmptyState'
import { SegmentedControl } from '@/ui/primitives/SegmentedControl'
import type { Shortcut } from '@/ui/shortcuts/shortcutRegistry'
import { useShortcuts } from '@/ui/shortcuts/useShortcuts'
import { ScreenShell } from '../ScreenShell'
import { TimelineAxis, TimelineGridLines } from './TimelineAxis'
import { TimelineFooter } from './TimelineFooter'
import { TimelineLegend } from './TimelineLegend'
import { TimelinePersonGroup } from './TimelinePersonGroup'
import { TimelinePhaseGroup } from './TimelinePhaseGroup'
import { TimelineProjectGroup } from './TimelineProjectGroup'
import {
  AXIS_LABELS,
  formatDragLabel,
  formatWindowSubhead,
  GROUPING_LABELS,
  ZOOM_LABELS,
} from './timelineLabels'
import { LABEL_COLUMN_WIDTH } from './TimelineRow'
import { useTimelineSchedule } from './useTimelineSchedule'

const SUBHEAD_FALLBACK = 'planejamento no tempo, com baseline'

// O zoom decide de quanto em quanto o eixo é dividido e o quanto cada divisão mede no mínimo.
// Na semana a soma passa da largura da janela e a grade rola; no mês e no trimestre ela cabe.
const MINIMUM_TICK_WIDTH: Record<TimelineZoom, number> = {
  week: 56,
  month: 90,
  quarter: 90,
}

const GROUPING_OPTIONS = TIMELINE_GROUPINGS.map((value) => ({
  value,
  label: GROUPING_LABELS[value],
}))

const ZOOM_OPTIONS = TIMELINE_ZOOMS.map((value) => ({ value, label: ZOOM_LABELS[value] }))

export function TimelineScreen() {
  const databaseStatus = useDatabaseStore((state) => state.status)
  const status = useProjectsStore((state) => state.status)
  const errorMessage = useProjectsStore((state) => state.errorMessage)
  const snapshot = useProjectsStore((state) => state.snapshot)
  const load = useProjectsStore((state) => state.load)
  const rescheduleTask = useProjectsStore((state) => state.rescheduleTask)
  const weekStart = useSettingsStore((state) => state.settings.weekStart)
  const notify = useToastStore((state) => state.notify)

  const [grouping, setGrouping] = useState<TimelineGrouping>('project')
  const [zoom, setZoom] = useState<TimelineZoom>('month')
  const [showBaseline, setShowBaseline] = useState(true)
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<EntityId>>(new Set())
  const todayMarkerRef = useRef<HTMLDivElement>(null)

  const today = todayIsoDate()

  useEffect(() => {
    if (databaseStatus !== 'ready') {
      return
    }

    void load()
  }, [databaseStatus, load])

  const rows = useMemo(() => buildTimelineRows(snapshot, today), [snapshot, today])
  const window = useMemo(
    () => buildTimelineWindow(collectRowPeriods(rows), zoom, today, weekStart),
    [rows, zoom, today, weekStart],
  )

  const sidebarItems = useMemo<SidebarContextItem[]>(
    () =>
      snapshot.phases
        .filter((phase) => phase.active)
        .map((phase) => ({ id: phase.id, label: phase.name, color: phase.color })),
    [snapshot.phases],
  )

  useSidebarContext(sidebarItems, null)

  function commitSchedule(taskId: EntityId, mode: ScheduleEditMode, offsetDays: number) {
    rescheduleTask(taskId, mode, offsetDays)
      .then(() => notify('Replanejamento registrado no histórico.'))
      .catch((cause: unknown) => {
        console.error('Não foi possível replanejar a tarefa.', cause)
        notify(toPublicMessage(cause), 'danger')
      })
  }

  const { pending, beginDrag, nudge, confirm, cancel } = useTimelineSchedule(
    window,
    commitSchedule,
  )

  const shortcuts = useMemo<Shortcut[]>(
    () => [
      {
        id: 'timeline-go-to-today',
        keys: 'h',
        scope: 'screen',
        description: 'Ir para hoje',
        run: () => goToToday(),
      },
      {
        id: 'timeline-toggle-baseline',
        keys: 'b',
        scope: 'screen',
        description: 'Mostrar a baseline',
        run: () => setShowBaseline((current) => !current),
      },
    ],
    [],
  )

  useShortcuts(shortcuts)

  function goToToday() {
    todayMarkerRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }

  function toggleGroup(id: EntityId) {
    setCollapsedIds((current) => {
      const next = new Set(current)

      if (!next.delete(id)) {
        next.add(id)
      }

      return next
    })
  }

  if (status === 'error') {
    return (
      <ScreenShell title="Timeline" subhead={SUBHEAD_FALLBACK}>
        <Alert
          level="danger"
          title="Não foi possível montar a timeline"
          action={
            <Button variant="danger" size="small" onClick={() => void load()}>
              Tentar de novo
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      </ScreenShell>
    )
  }

  if (status !== 'ready') {
    return (
      <ScreenShell title="Timeline" subhead={SUBHEAD_FALLBACK}>
        <p className="text-support text-text3">Carregando a timeline…</p>
      </ScreenShell>
    )
  }

  if (window === null) {
    return (
      <ScreenShell title="Timeline" subhead={SUBHEAD_FALLBACK}>
        <EmptyState
          size="large"
          title="Nenhuma tarefa com data"
          description="A timeline posiciona no tempo o período das tarefas. Dê início e fim a alguma delas para ela ter o que desenhar."
        />
      </ScreenShell>
    )
  }

  const groupRows = rows[grouping]
  const pendingTask =
    pending === null
      ? null
      : rows.project
          .flatMap((row) => row.tasks)
          .find((task) => task.id === pending.taskId)

  return (
    <ScreenShell
      title="Timeline"
      subhead={formatWindowSubhead(window)}
      lead={
        <div className="flex items-center gap-2 ml-2.5">
          <span className="text-label font-normal tracking-normal text-text3">Agrupar por</span>
          <SegmentedControl
            options={GROUPING_OPTIONS}
            value={grouping}
            onChange={setGrouping}
            label="Agrupar a timeline por"
            size="comfortable"
          />
        </div>
      }
      actions={
        <>
          <SegmentedControl
            options={ZOOM_OPTIONS}
            value={zoom}
            onChange={setZoom}
            label="Zoom da timeline"
            size="compact"
          />
          <Button keys="h" onClick={goToToday}>
            Ir para hoje
          </Button>
          <Button
            keys="b"
            pressed={showBaseline}
            onClick={() => setShowBaseline((current) => !current)}
          >
            Baseline
          </Button>
        </>
      }
      toolbar={
        <TimelineLegend
          today={today}
          currentPhaseColor={snapshot.phases.find((phase) => phase.active)?.color ?? null}
        />
      }
      contentClassName="flex-1 select-none overflow-auto"
      footer={
        <TimelineFooter
          grouping={grouping}
          groupCount={groupRows.length}
          itemCount={countVisibleItems(groupRows, collapsedIds)}
          conflictCount={countOverloads(rows)}
          dragLabel={
            pending === null || pendingTask?.period == null
              ? null
              : formatDragLabel(
                  pendingTask.title,
                  applyScheduleEdit(pendingTask.period, pending.mode, pending.offsetDays),
                )
          }
        />
      }
    >
      <div
        style={{ minWidth: LABEL_COLUMN_WIDTH + window.ticks.length * MINIMUM_TICK_WIDTH[zoom] }}
        className="flex min-h-full min-w-full flex-col"
      >
        <TimelineAxis window={window} label={AXIS_LABELS[grouping]} />

        <div className="relative flex-1">
          <TimelineGridLines
            window={window}
            todayPercent={toMarkerPercent(window, today)}
            todayRef={todayMarkerRef}
          />

          {groupRows.length === 0 && (
            <div className="p-5">
              <EmptyState
                size="large"
                title="Nada para posicionar aqui"
                description="Troque o agrupamento para ver a timeline pelo que já existe."
              />
            </div>
          )}

          {grouping === 'project' &&
            rows.project.map((row) => (
              <TimelineProjectGroup
                key={row.id}
                row={row}
                window={window}
                showBaseline={showBaseline}
                isExpanded={!collapsedIds.has(row.id)}
                onToggle={() => toggleGroup(row.id)}
                pending={pending}
                onBeginDrag={(event, taskId, mode) => beginDrag(event, taskId, mode)}
                onNudge={nudge}
                onConfirm={confirm}
                onCancel={cancel}
              />
            ))}

          {grouping === 'person' &&
            rows.person.map((row) => (
              <TimelinePersonGroup
                key={row.id}
                row={row}
                window={window}
                isExpanded={!collapsedIds.has(row.id)}
                onToggle={() => toggleGroup(row.id)}
              />
            ))}

          {grouping === 'phase' &&
            rows.phase.map((row) => (
              <TimelinePhaseGroup
                key={row.id}
                row={row}
                window={window}
                isExpanded={!collapsedIds.has(row.id)}
                onToggle={() => toggleGroup(row.id)}
              />
            ))}
        </div>
      </div>
    </ScreenShell>
  )
}
