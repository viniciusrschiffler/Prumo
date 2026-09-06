import { useEffect, useMemo } from 'react'
import { todayIsoDate } from '@/app/clock'
import { useDatabaseStore } from '@/app/stores/useDatabaseStore'
import { useProjectsStore } from '@/app/stores/useProjectsStore'
import { useSettingsStore } from '@/app/stores/useSettingsStore'
import { useTodosStore } from '@/app/stores/useTodosStore'
import { findConsistencyAlerts } from '@/domain/today/consistencyAlerts'
import { findPendingDecisions } from '@/domain/today/pendingDecisions'
import { buildTodayAgenda } from '@/domain/today/todayAgenda'
import { summarizeWeek } from '@/domain/today/weekNumbers'

export type TodayScreenStatus = 'loading' | 'ready' | 'error'

// O banco que não abriu é erro da tela, não espera eterna: sem ele os dois stores ficam
// parados em idle e a tela prometeria um carregamento que nunca termina.
function combineStatus(statuses: readonly string[]): TodayScreenStatus {
  if (statuses.includes('error')) {
    return 'error'
  }

  return statuses.every((status) => status === 'ready') ? 'ready' : 'loading'
}

export function useTodayScreenData() {
  const databaseStatus = useDatabaseStore((state) => state.status)
  const databaseError = useDatabaseStore((state) => state.errorMessage)
  const projectsStatus = useProjectsStore((state) => state.status)
  const projectsError = useProjectsStore((state) => state.errorMessage)
  const projects = useProjectsStore((state) => state.snapshot)
  const loadProjects = useProjectsStore((state) => state.load)
  const todosStatus = useTodosStore((state) => state.status)
  const todosError = useTodosStore((state) => state.errorMessage)
  const todos = useTodosStore((state) => state.snapshot)
  const loadTodos = useTodosStore((state) => state.load)
  const settings = useSettingsStore((state) => state.settings)

  useEffect(() => {
    if (databaseStatus !== 'ready') {
      return
    }

    void loadProjects()
    void loadTodos()
  }, [databaseStatus, loadProjects, loadTodos])

  const today = todayIsoDate()

  const agenda = useMemo(
    () =>
      buildTodayAgenda({
        todos: todos.todos,
        tasks: projects.tasks,
        projects: projects.projects,
        phases: projects.phases,
        people: projects.people,
        allocations: projects.allocations,
        today,
      }),
    [todos.todos, projects, today],
  )

  const decisions = useMemo(
    () =>
      findPendingDecisions({
        projects: projects.projects,
        tasks: projects.tasks,
        events: projects.events,
        allocations: projects.allocations,
        people: projects.people,
        today,
      }),
    [projects, today],
  )

  const alerts = useMemo(
    () =>
      findConsistencyAlerts({
        projects: projects.projects,
        tasks: projects.tasks,
        events: projects.events,
        notes: projects.notes,
        allocations: projects.allocations,
        people: projects.people,
        today,
        weekStart: settings.weekStart,
        staleAfterDays: settings.staleProjectAlertDays,
      }),
    [projects, today, settings.weekStart, settings.staleProjectAlertDays],
  )

  const week = useMemo(
    () =>
      summarizeWeek({
        projects: projects.projects,
        events: projects.events,
        allocations: projects.allocations,
        people: projects.people,
        todos: todos.todos,
        today,
        weekStart: settings.weekStart,
      }),
    [projects, todos.todos, today, settings.weekStart],
  )

  function retry() {
    void loadProjects()
    void loadTodos()
  }

  return {
    status: combineStatus([databaseStatus, projectsStatus, todosStatus]),
    errorMessage: projectsError ?? todosError ?? databaseError,
    today,
    agenda,
    decisions,
    alerts,
    week,
    projects,
    retry,
  }
}
