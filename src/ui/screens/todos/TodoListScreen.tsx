import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { todayIsoDate } from '@/app/clock'
import { useDatabaseStore } from '@/app/stores/useDatabaseStore'
import { useSettingsStore } from '@/app/stores/useSettingsStore'
import type { SidebarContextItem } from '@/app/stores/useSidebarContextStore'
import { useTodosStore } from '@/app/stores/useTodosStore'
import type { EntityId } from '@/domain/schemas/primitives'
import { TODO_BOARD_STATUSES, type TodoBoardStatus } from '@/domain/schemas/todoSchema'
import { toTodoDraft } from '@/domain/todos/editTodo'
import { emptyTodoDraft, type NewTodoDraft } from '@/domain/todos/newTodo'
import { buildTodoBoard, type TodoBoardDrop } from '@/domain/todos/todoBoard'
import {
  boardStatusOf,
  groupTodos,
  TODO_GROUP_MODES,
  type TodoGroupingContext,
  type TodoGroupMode,
} from '@/domain/todos/todoGrouping'
import { buildTodoRows, listProjectsWithPhase, listTodoRecurrences } from '@/domain/todos/todoRow'
import {
  countOpenTodosByProject,
  countTodosByStatus,
  listTagsInUse,
  summarizeTodos,
} from '@/domain/todos/todoSummary'
import { TODO_VIEWS, type TodoView } from '@/domain/todos/todoView'
import {
  TODO_GROUP_MODE_LABELS,
  TODO_STATUS_LABELS,
  TODO_VIEW_LABELS,
} from '@/ui/labels/entityLabels'
import { useSidebarContext, useSidebarLeadContext } from '@/ui/layout/useSidebarContext'
import { Button } from '@/ui/primitives/Button'
import { SegmentedControl } from '@/ui/primitives/SegmentedControl'
import type { Shortcut } from '@/ui/shortcuts/shortcutRegistry'
import { useShortcuts } from '@/ui/shortcuts/useShortcuts'
import { ScreenShell } from '../ScreenShell'
import { LinkProjectModal } from './LinkProjectModal'
import { TodoBoard } from './TodoBoard'
import { TodoGroupList } from './TodoGroupList'
import { TodoFormModal } from './TodoFormModal'
import { TodoQuickCapture } from './TodoQuickCapture'
import { TodoSidePanel } from './TodoSidePanel'
import { useTodoActions } from './useTodoActions'
import { isRowShortcut, useTodoRowFocus } from './useTodoRowFocus'

const GROUP_OPTIONS = TODO_GROUP_MODES.map((mode) => ({
  value: mode,
  label: TODO_GROUP_MODE_LABELS[mode],
}))

const VIEW_OPTIONS = TODO_VIEWS.map((view) => ({
  value: view,
  label: TODO_VIEW_LABELS[view],
}))

const SNOOZE_KEY = 's'
const EDIT_KEY = 'e'
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
  const weekStart = useSettingsStore((state) => state.settings.weekStart)
  const actions = useTodoActions()

  const [view, setView] = useState<TodoView>('list')
  const [groupMode, setGroupMode] = useState<TodoGroupMode>('due')
  const [showDone, setShowDone] = useState(false)
  const [activeStatus, setActiveStatus] = useState<TodoBoardStatus | null>(null)
  const [activeTagId, setActiveTagId] = useState<EntityId | null>(null)
  const [openDraft, setOpenDraft] = useState<NewTodoDraft | null>(null)
  const [editingTodoId, setEditingTodoId] = useState<EntityId | null>(null)
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
  const statusCounts = useMemo(() => countTodosByStatus(allRows), [allRows])
  const projectCounts = useMemo(
    () => countOpenTodosByProject(allRows, projects),
    [allRows, projects],
  )

  // Agrupado por status, o concluído tem coluna própria e é ela que o revela; nos outros
  // agrupamentos ele continua atrás do botão, senão a coluna "Feito" mentiria sobre estar vazia.
  const revealsDone = showDone || groupMode === 'status'

  const visibleRows = useMemo(
    () =>
      allRows.filter((row) => {
        const matchesDone = revealsDone || row.todo.status !== 'done'
        const matchesStatus = activeStatus === null || boardStatusOf(row) === activeStatus
        const matchesTag = activeTagId === null || row.tags.some((tag) => tag.id === activeTagId)

        return matchesDone && matchesStatus && matchesTag
      }),
    [allRows, revealsDone, activeStatus, activeTagId],
  )

  const groups = useMemo(
    () => groupTodos(visibleRows, groupMode, context, projects),
    [visibleRows, groupMode, context, projects],
  )

  const columns = useMemo(
    () => buildTodoBoard(visibleRows, groupMode, context, projects),
    [visibleRows, groupMode, context, projects],
  )

  const orderedIds = useMemo(
    () =>
      view === 'board'
        ? columns.flatMap((column) => column.group.items.map((row) => row.todo.id))
        : groups.flatMap((group) => group.items.map((row) => row.todo.id)),
    [view, columns, groups],
  )
  const rowFocus = useTodoRowFocus(orderedIds)

  const openNewTodo = useCallback(() => {
    setEditingTodoId(null)
    setOpenDraft(emptyTodoDraft())
  }, [])

  // O "+ Novo item" da coluna já sabe onde o card vai cair, então o formulário abre com aquele
  // campo preenchido — é o único jeito de o botão criar de fato naquela coluna.
  const openNewTodoIn = useCallback((drop: TodoBoardDrop | null) => {
    setEditingTodoId(null)
    setOpenDraft(() => {
      const draft = emptyTodoDraft()

      if (drop === null) {
        return draft
      }

      if (drop.kind === 'status') {
        return { ...draft, status: drop.status }
      }

      if (drop.kind === 'priority') {
        return { ...draft, priority: drop.priority }
      }

      if (drop.kind === 'project') {
        return { ...draft, projectId: drop.projectId }
      }

      return { ...draft, dueDate: drop.dueDate }
    })
  }, [])

  const openEditTodo = useCallback(
    (todoId: EntityId) => {
      const row = allRows.find((candidate) => candidate.todo.id === todoId)

      if (row === undefined) {
        return
      }

      setEditingTodoId(todoId)
      setOpenDraft(toTodoDraft({ todo: row.todo, tagNames: row.tags.map((tag) => tag.name) }))
    },
    [allRows],
  )

  const statusItems = useMemo<SidebarContextItem[]>(
    () =>
      statusCounts.map((entry) => ({
        id: entry.status,
        label: TODO_STATUS_LABELS[entry.status],
        meta: String(entry.count),
        subdued: entry.count === 0,
      })),
    [statusCounts],
  )

  const leadSection = useMemo(
    () => ({
      label: 'Status',
      items: statusItems,
      activeId: activeStatus,
      onSelect: (id: string) => {
        const picked = TODO_BOARD_STATUSES.find((candidate) => candidate === id) ?? null

        setActiveStatus((current) => (current === picked ? null : picked))
      },
    }),
    [statusItems, activeStatus],
  )

  useSidebarLeadContext(leadSection)

  const sidebarItems = useMemo<SidebarContextItem[]>(
    () => listTagsInUse(allRows, snapshot.tags).map((tag) => ({ id: tag.id, label: tag.name })),
    [allRows, snapshot.tags],
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
        run: openNewTodo,
      },
      {
        id: 'todos-toggle-view',
        keys: 'v',
        scope: 'screen',
        description: 'Alternar lista e Kanban',
        run: () => setView((current) => (current === 'list' ? 'board' : 'list')),
      },
    ],
    [openNewTodo],
  )

  useShortcuts(shortcuts)

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
        actions.snooze(todoId)
        return
      }

      if (event.key.toLowerCase() === EDIT_KEY) {
        event.preventDefault()
        openEditTodo(todoId)
        return
      }

      if (event.key === LINK_PROJECT_KEY) {
        event.preventDefault()
        setLinkingTodoId(todoId)
      }
    },
    [rowFocus, actions, openEditTodo],
  )

  function closeForm() {
    setOpenDraft(null)
    setEditingTodoId(null)
  }

  function handleSubmit(draft: NewTodoDraft) {
    const todoId = editingTodoId

    closeForm()

    if (todoId === null) {
      actions.create(draft)

      return
    }

    actions.update(todoId, draft)
  }

  function handleLink(todoId: EntityId, projectId: EntityId | null) {
    setLinkingTodoId(null)
    actions.link(todoId, projectId)
  }

  function clearFilters() {
    setActiveTagId(null)
    setActiveStatus(null)
    setShowDone(false)
  }

  const linkingRow = allRows.find((row) => row.todo.id === linkingTodoId) ?? null
  const isBoard = view === 'board'

  const subhead =
    status === 'ready'
      ? [
          `${summary.open} em aberto`,
          `${summary.inProgress} em progresso`,
          pluralize(summary.blocked, 'bloqueado', 'bloqueados'),
          pluralize(summary.late, 'atrasado', 'atrasados'),
        ].join(' · ')
      : 'itens soltos e recorrentes'

  return (
    <ScreenShell
      title="TodoList"
      subhead={subhead}
      lead={
        <div className="ml-1.5 flex items-center gap-2">
          <SegmentedControl
            options={VIEW_OPTIONS}
            value={view}
            onChange={setView}
            label="Visão"
            size="wide"
          />
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
          <Button variant="primary" keys="n" onClick={openNewTodo}>
            Novo item
          </Button>
        </>
      }
      toolbar={
        <TodoQuickCapture
          view={view}
          context={{ today: context.today, projects: projects.map((entry) => entry.project) }}
          onCapture={actions.capture}
        />
      }
      contentClassName={
        isBoard ? 'flex-1 overflow-hidden' : 'grid flex-1 grid-cols-[1fr_320px] overflow-hidden'
      }
    >
      {isBoard ? (
        <TodoBoard
          columns={columns}
          context={context}
          showStatus={groupMode !== 'status'}
          rowFocus={rowFocus}
          onDrop={actions.drop}
          onAdd={openNewTodoIn}
          onToggle={actions.toggle}
          onEdit={openEditTodo}
          onRowKeyDown={handleRowKeyDown}
        />
      ) : (
        <>
          <div className="grid content-start gap-3.5 overflow-auto px-5 pb-6 pt-3.5">
            <TodoGroupList
              status={status}
              errorMessage={errorMessage}
              groups={groups}
              context={context}
              showStatus={groupMode !== 'status'}
              hasAnyTodo={allRows.length > 0}
              rowFocus={rowFocus}
              onRetry={() => void load()}
              onClearFilters={clearFilters}
              onToggle={actions.toggle}
              onEdit={openEditTodo}
              onRowKeyDown={handleRowKeyDown}
            />
          </div>

          <TodoSidePanel
            summary={summary}
            projectCounts={projectCounts}
            recurrences={recurrences}
          />
        </>
      )}

      {openDraft !== null && (
        <TodoFormModal
          mode={editingTodoId === null ? 'create' : 'edit'}
          projects={projects.map((entry) => entry.project)}
          groupMode={groupMode}
          context={context}
          initialDraft={openDraft}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}

      {linkingRow !== null && (
        <LinkProjectModal
          todoTitle={linkingRow.todo.title}
          projects={projects}
          selectedProjectId={linkingRow.todo.projectId}
          onClose={() => setLinkingTodoId(null)}
          onSelect={(projectId) => handleLink(linkingRow.todo.id, projectId)}
        />
      )}
    </ScreenShell>
  )
}
