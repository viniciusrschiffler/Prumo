import { Fragment, useMemo } from 'react'
import { mapOpenPercentagesByTask, type AllocationRow } from '@/domain/projects/allocationRows'
import type { ProjectTaskRow } from '@/domain/projects/projectRow'
import { countTasksByFilter, filterTaskRows, type TaskFilter } from '@/domain/projects/taskFilters'
import { groupTasksByPhase, sumTaskGroups } from '@/domain/projects/taskGroups'
import { formatIsoDate } from '@/domain/format/displayDate'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { EntityId } from '@/domain/schemas/primitives'
import type { TaskDependency } from '@/domain/schemas/taskSchema'
import { AddButton } from '@/ui/primitives/AddButton'
import { Button } from '@/ui/primitives/Button'
import { EmptyState } from '@/ui/primitives/EmptyState'
import { FilterChip, FilterChipGroup } from '@/ui/primitives/FilterChip'
import { Input } from '@/ui/primitives/Input'
import { useGridNavigation } from '@/ui/primitives/useGridNavigation'
import { PhaseGroupHeader, TASK_GRID_COLUMNS, TaskLine } from './TaskPhaseGroup'

const FILTER_LABELS: Record<TaskFilter, string> = {
  all: 'Todas',
  open: 'Abertas',
  delayed: 'Atrasadas',
  unassigned: 'Sem responsável',
}

const COLUMNS = [
  { label: 'Tarefa', numeric: false },
  { label: 'Status', numeric: false },
  { label: 'Pessoas', numeric: false },
  { label: 'Esf.', numeric: true },
  { label: 'Início', numeric: true },
  { label: 'Fim', numeric: true },
  { label: 'Desvio', numeric: true },
] as const

type TasksTabProps = {
  rows: readonly ProjectTaskRow[]
  phases: readonly Phase[]
  allocationRows: readonly AllocationRow[]
  dependencies: readonly TaskDependency[]
  filter: TaskFilter
  search: string
  onFilterChange: (filter: TaskFilter) => void
  onSearchChange: (search: string) => void
  onNewTask: () => void
}

export function TasksTab({
  rows,
  phases,
  allocationRows,
  dependencies,
  filter,
  search,
  onFilterChange,
  onSearchChange,
  onNewTask,
}: TasksTabProps) {
  const counts = useMemo(() => countTasksByFilter(rows), [rows])
  const visibleRows = useMemo(
    () => filterTaskRows(rows, filter, search),
    [rows, filter, search],
  )
  const groups = useMemo(() => groupTasksByPhase(visibleRows, phases), [visibleRows, phases])
  const totals = useMemo(() => sumTaskGroups(groups), [groups])
  const percentages = useMemo(
    () => mapOpenPercentagesByTask(allocationRows),
    [allocationRows],
  )
  const titlesById = useMemo(
    () => new Map(rows.map((row) => [row.task.id, row.task.title])),
    [rows],
  )

  const orderedIds = groups.flatMap((group) => group.tasks.map((row) => row.task.id))
  const navigation = useGridNavigation({ rowIds: orderedIds })

  function dependenciesOf(taskId: EntityId): string[] {
    return dependencies
      .filter((dependency) => dependency.taskId === taskId)
      .map((dependency) => titlesById.get(dependency.dependsOnTaskId))
      .filter((title) => title !== undefined)
  }

  return (
    <div className="grid gap-3.5">
      <div className="flex items-center gap-2">
        <Input
          value={search}
          placeholder="Filtrar tarefas"
          aria-label="Filtrar tarefas"
          fieldSize="small"
          textSize="support"
          onChange={(event) => onSearchChange(event.target.value)}
          className="max-w-65 flex-1"
        />
        <FilterChipGroup label="Filtrar tarefas por situação">
          {Object.entries(FILTER_LABELS).map(([value, label]) => (
            <FilterChip
              key={value}
              label={label}
              count={counts[value as TaskFilter]}
              selected={filter === value}
              onSelect={() => onFilterChange(value as TaskFilter)}
            />
          ))}
        </FilterChipGroup>
        <span className="ml-auto text-label font-normal tracking-normal text-text3">
          agrupado por fase
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Nenhuma tarefa ainda"
          description="Crie a primeira tarefa para que o esforço, a janela e o progresso do projeto passem a existir."
          action={
            <Button variant="primary" keys="t" onClick={onNewTask}>
              Nova tarefa
            </Button>
          }
        />
      ) : visibleRows.length === 0 ? (
        <EmptyState
          title="Nenhuma tarefa neste filtro"
          description={`Ajuste a busca ou o filtro para ver as outras ${rows.length} tarefas do projeto.`}
          action={
            <Button
              onClick={() => {
                onFilterChange('all')
                onSearchChange('')
              }}
            >
              Limpar filtros
            </Button>
          }
        />
      ) : (
        <div role="table" aria-label="Tarefas do projeto" className="overflow-hidden rounded-card border border-border bg-panel">
          <div
            role="row"
            className={`${TASK_GRID_COLUMNS} border-b border-border bg-sunken px-3 py-[7px] text-column uppercase text-text2`}
          >
            {COLUMNS.map((column) => (
              <span key={column.label} className={column.numeric ? 'text-right' : undefined}>
                {column.label}
              </span>
            ))}
          </div>

          {groups.map((group) => (
            <Fragment key={group.phase?.id ?? 'sem-fase'}>
              <PhaseGroupHeader group={group} />
              {group.tasks.map((row) => (
                <TaskLine
                  key={row.task.id}
                  row={row}
                  percentageByPerson={percentages.get(row.task.id) ?? new Map()}
                  dependsOn={dependenciesOf(row.task.id)}
                  rowProps={navigation.getRowProps(row.task.id)}
                />
              ))}
            </Fragment>
          ))}

          <div className="flex items-center gap-2 px-3 pb-2 pt-1.5">
            <AddButton keys="t" onClick={onNewTask}>
              + Nova tarefa
            </AddButton>
            <span className="ml-auto font-mono text-label font-normal tabular-nums tracking-normal text-text2">
              ∑ {totals.effortHours}h · {totals.countedTaskCount}{' '}
              {totals.countedTaskCount === 1 ? 'tarefa' : 'tarefas'}
              {totals.period !== null &&
                ` · ${formatIsoDate(totals.period.start)} → ${formatIsoDate(totals.period.end)}`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
