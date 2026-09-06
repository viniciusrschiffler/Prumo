import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { todayIsoDate } from '@/app/clock'
import { useDatabaseStore } from '@/app/stores/useDatabaseStore'
import { useSettingsStore } from '@/app/stores/useSettingsStore'
import type { SidebarContextItem } from '@/app/stores/useSidebarContextStore'
import { useTodosStore } from '@/app/stores/useTodosStore'
import { useToastStore } from '@/app/stores/useToastStore'
import { toPublicMessage } from '@/domain/errors/PrumoError'
import type { EntityId } from '@/domain/schemas/primitives'
import type { NewTodoDraft } from '@/domain/todos/newTodo'
import { DEFAULT_TODO_PRIORITY } from '@/domain/todos/newTodo'
import type { QuickCapture } from '@/domain/todos/quickCapture'
import {
  groupTodos,
  TODO_GROUP_MODES,
  type TodoGroupingContext,
  type TodoGroupMode,
} from '@/domain/todos/todoGrouping'
import { buildTodoRows, listProjectsWithPhase, listTodoRecurrences } from '@/domain/todos/todoRow'
import { countOpenTodosByProject, summarizeTodos } from '@/domain/todos/todoSummary'
import { TODO_GROUP_MODE_LABELS } from '@/ui/labels/entityLabels'
import { useSidebarContext } from '@/ui/layout/useSidebarContext'
import { Button } from '@/ui/primitives/Button'
import { SegmentedControl } from '@/ui/primitives/SegmentedControl'
import type { Shortcut } from '@/ui/shortcuts/shortcutRegistry'
import { useShortcuts } from '@/ui/shortcuts/useShortcuts'
import { ScreenShell } from '../ScreenShell'
import { LinkProjectModal } from './LinkProjectModal'
import { TodoGroupList } from './TodoGroupList'
import { NewTodoModal } from './NewTodoModal'
import { TodoQuickCapture } from './TodoQuickCapture'
import { TodoSidePanel } from './TodoSidePanel'
import { isRowShortcut, useTodoRowFocus } from './useTodoRowFocus'

const GROUP_OPTIONS = TODO_GROUP_MODES.map((mode) => ({
  value: mode,
  label: TODO_GROUP_MODE_LABELS[mode],
}))

const SNOOZE_KEY = 's'
const LINK_PROJECT_KEY = '@'

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function TodoListScreen() {
  const databaseStatus = useDatabaseStore((state) => state.status)
  const status = useTodosStore((state) => state.status)
  const errorMessage = useTodosStore((state) => state.errorMessage)
  const snapshot = useTodosStore((state) => state.snapshot)
  const load = useTodosStore((state) => state.load)
  const createTodo = useTodosStore((state) => state.createTodo)
  const toggleTodo = useTodosStore((state) => state.toggleTodo)
  const snoozeTodo = useTodosStore((state) => state.snoozeTodo)
  const linkProject = useTodosStore((state) => state.linkProject)
  const weekStart = useSettingsStore((state) => state.settings.weekStart)
  const notify = useToastStore((state) => state.notify)

  const [groupMode, setGroupMode] = useState<TodoGroupMode>('due')
  const [showDone, setShowDone] = useState(false)
  const [activeTagId, setActiveTagId] = useState<EntityId | null>(null)
  const [newTodoDraft, setNewTodoDraft] = useState<Partial<NewTodoDraft> | null>(null)
  const [linkingTodoId, setLinkingTodoId] = useState<EntityId | null>(null)

  useEffect(() => {
    if (databaseStatus !== 'ready') {
      return
    }

    void load()
  }, [databaseStatus, load])

  const context = useMemo<TodoGroupingContext>(
    () => ({ today: todayIsoDate(), weekStart }),
    [weekStart],
  )

  const allRows = useMemo(() => buildTodoRows(snapshot), [snapshot])
  const projects = useMemo(() => listProjectsWithPhase(snapshot), [snapshot])
  const recurrences = useMemo(() => listTodoRecurrences(snapshot), [snapshot])
  const summary = useMemo(() => summarizeTodos(allRows, context), [allRows, context])
  const projectCounts = useMemo(
    () => countOpenTodosByProject(allRows, projects),
    [allRows, projects],
  )

  const visibleRows = useMemo(
    () =>
      allRows.filter((row) => {
        const matchesDone = showDone || row.todo.status !== 'done'
        const matchesTag = activeTagId === null || row.tags.some((tag) => tag.id === activeTagId)

        return matchesDone && matchesTag
      }),
    [allRows, showDone, activeTagId],
  )

  const groups = useMemo(
    () => groupTodos(visibleRows, groupMode, context, projects),
    [visibleRows, groupMode, context, projects],
  )

  const orderedIds = useMemo(
    () => groups.flatMap((group) => group.items.map((row) => row.todo.id)),
    [groups],
  )
  const rowFocus = useTodoRowFocus(orderedIds)

  const sidebarItems = useMemo<SidebarContextItem[]>(
    () =>
      snapshot.tags
        .filter((tag) => allRows.some((row) => row.tags.some((rowTag) => rowTag.id === tag.id)))
        .map((tag) => ({ id: tag.id, label: tag.name })),
    [snapshot.tags, allRows],
  )

  useSidebarContext(sidebarItems, activeTagId, (id) =>
    setActiveTagId((current) => (current === id ? null : id)),
  )

  const shortcuts = useMemo<Shortcut[]>(
    () => [
      {
        id: 'todos-new',
        keys: 'n',
        scope: 'screen',
        description: 'Novo item',
        run: () => setNewTodoDraft({}),
      },
    ],
    [],
  )

  useShortcuts(shortcuts)

  const run = useCallback(
    async (action: () => Promise<void>, failure: string) => {
      try {
        await action()
      } catch (cause) {
        console.error(failure, cause)
        notify(toPublicMessage(cause), 'danger')
      }
    },
    [notify],
  )

  const handleRowKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>, todoId: EntityId) => {
      if (!isRowShortcut(event)) {
        return
      }

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        if (rowFocus.moveFocus(todoId, event.key === 'ArrowDown' ? 1 : -1)) {
          event.preventDefault()
        }

        return
      }

      if (event.key.toLowerCase() === SNOOZE_KEY) {
        event.preventDefault()
        void run(() => snoozeTodo(todoId), 'Não foi possível adiar o todo.')
        return
      }

      if (event.key === LINK_PROJECT_KEY) {
        event.preventDefault()
        setLinkingTodoId(todoId)
      }
    },
    [rowFocus, run, snoozeTodo],
  )

  async function handleCapture(capture: QuickCapture) {
    await run(
      () =>
        createTodo({
          title: capture.title,
          description: '',
          projectId: capture.projectId,
          dueDate: capture.dueDate,
          priority: capture.priority ?? DEFAULT_TODO_PRIORITY,
          tagNames: capture.tagNames,
        }),
      'Não foi possível capturar o todo.',
    )
  }

  async function handleCreate(draft: NewTodoDraft) {
    setNewTodoDraft(null)

    await run(() => createTodo(draft), 'Não foi possível criar o todo.')
  }

  async function handleLink(projectId: EntityId | null) {
    const todoId = linkingTodoId

    setLinkingTodoId(null)

    if (todoId !== null) {
      await run(() => linkProject(todoId, projectId), 'Não foi possível vincular o projeto.')
    }
  }

  const linkingRow = allRows.find((row) => row.todo.id === linkingTodoId) ?? null

  const subhead =
    status === 'ready'
      ? [
          `${summary.open} em aberto`,
          pluralize(summary.late, 'atrasado', 'atrasados'),
          `${pluralize(summary.linkedToProject, 'vinculado', 'vinculados')} a projeto`,
        ].join(' · ')
      : 'itens soltos e recorrentes'

  return (
    <ScreenShell
      title="TodoList"
      subhead={subhead}
      lead={
        <div className="ml-2.5 flex items-center gap-2">
          <span className="text-label font-normal tracking-normal text-text3">Agrupar por</span>
          <SegmentedControl
            options={GROUP_OPTIONS}
            value={groupMode}
            onChange={setGroupMode}
            label="Agrupar por"
          />
        </div>
      }
      actions={
        <>
          <Button pressed={showDone} onClick={() => setShowDone(!showDone)}>
            {showDone ? 'Ocultar concluídos' : 'Mostrar concluídos'}
          </Button>
          <Button variant="primary" keys="n" onClick={() => setNewTodoDraft({})}>
            Novo item
          </Button>
        </>
      }
      toolbar={
        <TodoQuickCapture
          context={{ today: context.today, projects: projects.map((entry) => entry.project) }}
          onCapture={(capture) => void handleCapture(capture)}
        />
      }
      contentClassName="grid flex-1 grid-cols-[1fr_320px] overflow-hidden"
    >
      <div className="grid content-start gap-3.5 overflow-auto px-5 pb-6 pt-3.5">
        <TodoGroupList
          status={status}
          errorMessage={errorMessage}
          groups={groups}
          context={context}
          hasAnyTodo={allRows.length > 0}
          rowFocus={rowFocus}
          onRetry={() => void load()}
          onClearFilters={() => {
            setActiveTagId(null)
            setShowDone(false)
          }}
          onToggle={(todoId) =>
            void run(() => toggleTodo(todoId), 'Não foi possível marcar o todo.')
          }
          onRowKeyDown={handleRowKeyDown}
        />
      </div>

      <TodoSidePanel
        summary={summary}
        projectCounts={projectCounts}
        recurrences={recurrences}
      />

      {newTodoDraft !== null && (
        <NewTodoModal
          projects={projects.map((entry) => entry.project)}
          groupMode={groupMode}
          context={context}
          initialDraft={newTodoDraft}
          onClose={() => setNewTodoDraft(null)}
          onSubmit={(draft) => void handleCreate(draft)}
        />
      )}

      {linkingRow !== null && (
        <LinkProjectModal
          todoTitle={linkingRow.todo.title}
          projects={projects}
          selectedProjectId={linkingRow.todo.projectId}
          onClose={() => setLinkingTodoId(null)}
          onSelect={(projectId) => void handleLink(projectId)}
        />
      )}
    </ScreenShell>
  )
}
