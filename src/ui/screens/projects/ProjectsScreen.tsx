import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useDatabaseStore } from '@/app/stores/useDatabaseStore'
import { useProjectsStore } from '@/app/stores/useProjectsStore'
import type { SidebarContextItem } from '@/app/stores/useSidebarContextStore'
import {
  ALL_STATUSES,
  countProjectsByStatus,
  countProjectsMatchingView,
  filterProjectRows,
  parseProjectsViewFilters,
  type ProjectStatusFilter,
} from '@/domain/projects/projectFilters'
import { buildProjectRows } from '@/domain/projects/projectRow'
import { sortProjectRows, type ProjectSortKey } from '@/domain/projects/projectSort'
import { sumProjectsTotals } from '@/domain/projects/projectTotals'
import type { EntityId } from '@/domain/schemas/primitives'
import { PROJECT_STATUS_LABELS } from '@/ui/labels/entityLabels'
import { useSidebarContext } from '@/ui/layout/useSidebarContext'
import { Alert } from '@/ui/primitives/Alert'
import { Button } from '@/ui/primitives/Button'
import { EmptyState } from '@/ui/primitives/EmptyState'
import { Input } from '@/ui/primitives/Input'
import { SegmentedControl } from '@/ui/primitives/SegmentedControl'
import { useGridNavigation } from '@/ui/primitives/useGridNavigation'
import { useRowSelection } from '@/ui/primitives/useRowSelection'
import { SCREEN_META } from '@/ui/layout/screenMeta'
import { ScreenShell } from '../ScreenShell'
import { ProjectsFooter } from './ProjectsFooter'
import { ProjectsTable } from './ProjectsTable'
import { ProjectsToolbar } from './ProjectsToolbar'

const EFFORT_OPTIONS = [
  { value: 'hours', label: 'Por horas' },
  { value: 'tasks', label: 'Por tarefas' },
] as const

type EffortMode = (typeof EFFORT_OPTIONS)[number]['value']

export function ProjectsScreen() {
  const navigate = useNavigate()
  const databaseStatus = useDatabaseStore((state) => state.status)
  const status = useProjectsStore((state) => state.status)
  const errorMessage = useProjectsStore((state) => state.errorMessage)
  const snapshot = useProjectsStore((state) => state.snapshot)
  const savedViews = useProjectsStore((state) => state.savedViews)
  const load = useProjectsStore((state) => state.load)

  const [effortMode, setEffortMode] = useState<EffortMode>('hours')
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>(ALL_STATUSES)
  const [sortKey, setSortKey] = useState<ProjectSortKey>('priority')
  const [search, setSearch] = useState('')
  const [activeViewId, setActiveViewId] = useState<EntityId | null>(null)
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<EntityId>>(new Set())

  useEffect(() => {
    if (databaseStatus !== 'ready') {
      return
    }

    void load()
  }, [databaseStatus, load])

  const allRows = useMemo(() => buildProjectRows(snapshot), [snapshot])

  const readableViews = useMemo(
    () =>
      savedViews
        .map((view) => ({ view, filters: parseProjectsViewFilters(view.filtersJson) }))
        .filter((entry) => entry.filters !== null),
    [savedViews],
  )

  const activeView = readableViews.find((entry) => entry.view.id === activeViewId) ?? null

  const visibleRows = useMemo(() => {
    const filtered = filterProjectRows(allRows, {
      status: statusFilter,
      search,
      viewFilters: activeView?.filters ?? null,
    })

    return sortProjectRows(filtered, sortKey)
  }, [allRows, statusFilter, search, activeView, sortKey])

  const visibleIds = useMemo(() => visibleRows.map((row) => row.project.id), [visibleRows])
  const selection = useRowSelection(visibleIds)
  const statusCounts = useMemo(() => countProjectsByStatus(allRows), [allRows])
  const totals = useMemo(() => sumProjectsTotals(visibleRows), [visibleRows])

  const sidebarItems = useMemo<SidebarContextItem[]>(
    () =>
      readableViews.map((entry) => ({
        id: entry.view.id,
        label: entry.view.name,
        meta: String(countProjectsMatchingView(allRows, entry.filters ?? {})),
      })),
    [readableViews, allRows],
  )

  useSidebarContext(sidebarItems, activeViewId, (id) =>
    setActiveViewId((current) => (current === id ? null : id)),
  )

  const toggleExpand = useCallback((id: EntityId) => {
    setExpandedIds((current) => {
      const next = new Set(current)

      if (!next.delete(id)) {
        next.add(id)
      }

      return next
    })
  }, [])

  const expandableIds = useMemo(
    () => visibleRows.filter((row) => row.tasks.length > 0).map((row) => row.project.id),
    [visibleRows],
  )
  const isAnyExpanded = expandableIds.some((id) => expandedIds.has(id))

  const openProject = useCallback(
    (id: EntityId) => void navigate(SCREEN_META.project.path.replace(':projectId', id)),
    [navigate],
  )

  const navigation = useGridNavigation({
    rowIds: visibleIds,
    onActivate: openProject,
    onToggleSelect: selection.select,
    onExpand: (id) => setExpandedIds((current) => new Set(current).add(id)),
    onCollapse: (id) =>
      setExpandedIds((current) => {
        const next = new Set(current)
        next.delete(id)

        return next
      }),
  })

  const subhead =
    status === 'ready'
      ? `${visibleRows.length} de ${allRows.length} projetos · filtro: ${
          statusFilter === ALL_STATUSES
            ? 'todos'
            : PROJECT_STATUS_LABELS[statusFilter].toLocaleLowerCase('pt-BR')
        }`
      : 'todos os projetos e suas tarefas'

  return (
    <ScreenShell
      title="Projetos"
      subhead={subhead}
      lead={
        <Input
          value={search}
          placeholder="Filtrar por nome ou tag"
          aria-label="Filtrar por nome ou tag"
          onChange={(event) => setSearch(event.target.value)}
          className="ml-2 max-w-70 flex-1 text-support"
        />
      }
      actions={
        <>
          <SegmentedControl
            options={EFFORT_OPTIONS}
            value={effortMode}
            onChange={setEffortMode}
            label="Medir esforço e progresso"
          />
          <Button
            onClick={() =>
              setExpandedIds(isAnyExpanded ? new Set() : new Set(expandableIds))
            }
          >
            {isAnyExpanded ? 'Recolher tudo' : 'Expandir tudo'}
          </Button>
        </>
      }
      toolbar={
        <ProjectsToolbar
          status={statusFilter}
          counts={statusCounts}
          sortKey={sortKey}
          onStatusChange={setStatusFilter}
          onSortChange={setSortKey}
        />
      }
      contentClassName="flex-1 overflow-auto"
      footer={<ProjectsFooter totals={totals} />}
    >
      {status === 'error' ? (
        <div className="p-5">
          <Alert
            level="danger"
            title="Não foi possível abrir os projetos"
            action={
              <Button variant="danger" size="small" onClick={() => void load()}>
                Tentar de novo
              </Button>
            }
          >
            {errorMessage}
          </Alert>
        </div>
      ) : status !== 'ready' ? (
        <p className="p-5 text-support text-text3">Carregando os projetos…</p>
      ) : allRows.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="Nenhum projeto ainda"
            description="Crie o primeiro projeto para começar a planejar fases, tarefas e alocações."
          />
        </div>
      ) : visibleRows.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="Nenhum projeto neste filtro"
            description={`Ajuste o status, a busca ou a visão salva para ver os outros ${allRows.length} projetos.`}
            action={
              <Button
                onClick={() => {
                  setStatusFilter(ALL_STATUSES)
                  setSearch('')
                  setActiveViewId(null)
                }}
              >
                Limpar filtros
              </Button>
            }
          />
        </div>
      ) : (
        <ProjectsTable
          rows={visibleRows}
          byHours={effortMode === 'hours'}
          expandedIds={expandedIds}
          selectedIds={selection.selectedIds}
          navigation={navigation}
          onToggleExpand={toggleExpand}
          onSelect={selection.select}
          onOpen={openProject}
        />
      )}
    </ScreenShell>
  )
}
