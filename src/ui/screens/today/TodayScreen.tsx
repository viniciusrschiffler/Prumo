import { useCallback, useMemo, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { useCommandPaletteStore } from '@/app/stores/useCommandPaletteStore'
import type { SidebarContextItem } from '@/app/stores/useSidebarContextStore'
import { formatIsoDate } from '@/domain/format/displayDate'
import { formatWeekdayAbbreviation } from '@/domain/format/dueLabel'
import { formatDeviation } from '@/domain/format/formatDeviation'
import { emptyProjectDraft } from '@/domain/projects/newProject'
import { buildProjectRows } from '@/domain/projects/projectRow'
import {
  listAllocationsEndedByBlock,
  type UnblockProjectDraft,
} from '@/domain/projects/unblockProjects'
import type { EntityId } from '@/domain/schemas/primitives'
import type { PendingDecision } from '@/domain/today/pendingDecisions'
import { SCREEN_META } from '@/ui/layout/screenMeta'
import { useSidebarContext } from '@/ui/layout/useSidebarContext'
import { Button } from '@/ui/primitives/Button'
import { QuickCaptureField } from '@/ui/primitives/QuickCaptureField'
import type { Shortcut } from '@/ui/shortcuts/shortcutRegistry'
import { useShortcuts } from '@/ui/shortcuts/useShortcuts'
import { RegisterEventModal } from '../project/RegisterEventModal'
import { ProjectFormModal } from '../projects/ProjectFormModal'
import { ScreenShell } from '../ScreenShell'
import { useTodoActions } from '../todos/useTodoActions'
import { isRowShortcut, useTodoRowFocus } from '../todos/useTodoRowFocus'
import { PostponeResumeModal } from './PostponeResumeModal'
import { TodayContextColumn } from './TodayContextColumn'
import { TodayMainColumn } from './TodayMainColumn'
import { UnblockProjectModal } from './UnblockProjectModal'
import { useTodayActions } from './useTodayActions'
import { useTodayScreenData } from './useTodayScreenData'

const CAPTURE_PLACEHOLDER = 'Captura rápida — vira todo com #tag, @projeto, !p0 e data'

type OpenModal =
  | { kind: 'project' }
  | { kind: 'unblock'; decision: PendingDecision }
  | { kind: 'postpone'; decision: PendingDecision }
  | { kind: 'event'; decision: PendingDecision }
  | null

export function TodayScreen() {
  const navigate = useNavigate()
  const { status, errorMessage, today, agenda, decisions, alerts, week, projects, retry } =
    useTodayScreenData()
  const openCommandPalette = useCommandPaletteStore((state) => state.open)
  const actions = useTodayActions()
  const todoActions = useTodoActions()

  const [openModal, setOpenModal] = useState<OpenModal>(null)

  const activeProjects = useMemo(
    () => projects.projects.filter((project) => project.archivedAt === null),
    [projects.projects],
  )

  const sidebarItems = useMemo<SidebarContextItem[]>(
    () =>
      buildProjectRows(projects)
        .filter((row) => row.project.archivedAt === null)
        .map((row) => ({
          id: row.project.id,
          label: row.project.name,
          meta: row.isDelayed ? formatDeviation(row.deviationInDays) : undefined,
          metaTone: 'danger',
          metaDot: row.hasOpenRisk ? 'danger' : undefined,
        })),
    [projects],
  )

  useSidebarContext(sidebarItems, null, (id) =>
    void navigate(SCREEN_META.project.path.replace(':projectId', id)),
  )

  const orderedTodoIds = useMemo(
    () => agenda.dueTodos.map((row) => row.todo.id),
    [agenda.dueTodos],
  )
  const rowFocus = useTodoRowFocus(orderedTodoIds)

  const shortcuts = useMemo<Shortcut[]>(
    () => [
      {
        id: 'today-new-project',
        keys: 'mod+n',
        scope: 'screen',
        description: 'Novo projeto',
        run: () => setOpenModal({ kind: 'project' }),
      },
    ],
    [],
  )

  useShortcuts(shortcuts)

  const handleRowKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>, todoId: EntityId) => {
      if (!isRowShortcut(event) || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) {
        return
      }

      if (rowFocus.moveFocus(todoId, event.key === 'ArrowDown' ? 1 : -1)) {
        event.preventDefault()
      }
    },
    [rowFocus],
  )

  function countEndedByBlock(decision: PendingDecision): number {
    if (decision.blockEvent === null) {
      return 0
    }

    return listAllocationsEndedByBlock({
      blockEvent: decision.blockEvent,
      tasks: projects.tasks.filter((task) => task.projectId === decision.project.id),
      allocations: projects.allocations,
    }).length
  }

  function handleUnblock(decision: PendingDecision, draft: UnblockProjectDraft) {
    setOpenModal(null)
    actions.unblock(decision.project.id, decision.project.name, draft)
  }

  function nameOf(projectId: EntityId): string {
    return decisions.find((decision) => decision.project.id === projectId)?.project.name ?? ''
  }

  function openCapacity() {
    void navigate(SCREEN_META.capacity.path)
  }

  return (
    <ScreenShell
      title="Hoje"
      subhead={`${formatWeekdayAbbreviation(today)}, ${formatIsoDate(today)} · semana ${week.weekNumber}`}
      lead={
        <QuickCaptureField
          context={{ today, projects: activeProjects }}
          onCapture={todoActions.capture}
          placeholder={CAPTURE_PLACEHOLDER}
          className="ml-2 max-w-[420px] flex-1"
        />
      }
      actions={
        <>
          <Button keys="mod+k" onClick={openCommandPalette}>
            Comandos
          </Button>
          <Button variant="primary" keys="mod+n" onClick={() => setOpenModal({ kind: 'project' })}>
            Novo projeto
          </Button>
        </>
      }
      contentClassName="grid flex-1 grid-cols-[1fr_372px] overflow-hidden"
    >
      <div className="grid content-start gap-[18px] overflow-auto px-5 pb-7 pt-4">
        <TodayMainColumn
          status={status}
          errorMessage={errorMessage}
          agenda={agenda}
          today={today}
          rowFocus={rowFocus}
          onRetry={retry}
          onToggleTodo={todoActions.toggle}
          onRowKeyDown={handleRowKeyDown}
        />
      </div>

      <div className="grid content-start gap-4 overflow-auto border-l border-border bg-sunken p-4">
        {status === 'ready' && (
          <TodayContextColumn
            decisions={decisions}
            alerts={alerts}
            week={week}
            onUnblock={(decision) => setOpenModal({ kind: 'unblock', decision })}
            onRegisterEvent={(decision) => setOpenModal({ kind: 'event', decision })}
            onPostpone={(decision) => setOpenModal({ kind: 'postpone', decision })}
            onResume={(projectId) => actions.resume(projectId, nameOf(projectId))}
            onOpenCapacity={openCapacity}
          />
        )}
      </div>

      {openModal?.kind === 'project' && (
        <ProjectFormModal
          mode="create"
          people={projects.people}
          initialDraft={emptyProjectDraft()}
          onClose={() => setOpenModal(null)}
          onSubmit={(draft) => {
            setOpenModal(null)
            actions.createProject(draft)
          }}
        />
      )}

      {openModal?.kind === 'unblock' && (
        <UnblockProjectModal
          projectName={openModal.decision.project.name}
          endedAllocationCount={countEndedByBlock(openModal.decision)}
          onClose={() => setOpenModal(null)}
          onSubmit={(draft) => handleUnblock(openModal.decision, draft)}
        />
      )}

      {openModal?.kind === 'postpone' && (
        <PostponeResumeModal
          decision={openModal.decision}
          today={today}
          onClose={() => setOpenModal(null)}
          onSubmit={(draft) => {
            setOpenModal(null)
            actions.postpone(draft)
          }}
        />
      )}

      {openModal?.kind === 'event' && (
        <RegisterEventModal
          projectId={openModal.decision.project.id}
          projectName={openModal.decision.project.name}
          today={today}
          onClose={() => setOpenModal(null)}
          onSubmit={(draft) => {
            setOpenModal(null)
            actions.registerEvent(draft)
          }}
        />
      )}
    </ScreenShell>
  )
}
