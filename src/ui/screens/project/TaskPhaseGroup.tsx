import type { ProjectTaskRow } from '@/domain/projects/projectRow'
import type { TaskPhaseGroup as PhaseGroup } from '@/domain/projects/taskGroups'
import { formatDeviation } from '@/domain/format/formatDeviation'
import { formatIsoDate } from '@/domain/format/displayDate'
import type { EntityId } from '@/domain/schemas/primitives'
import { classNames } from '@/ui/primitives/classNames'
import { FOCUS_RING } from '@/ui/primitives/focusRing'
import { PersonAllocationChip, UnassignedChip } from '@/ui/primitives/PersonAllocationChip'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'
import { TaskStatusBadge } from '@/ui/primitives/StatusBadge'
import type { GridRowProps } from '@/ui/primitives/useGridNavigation'

export const TASK_GRID_COLUMNS =
  'grid grid-cols-[minmax(0,1fr)_100px_118px_56px_88px_88px_52px] gap-2'

const SHORT_DATE_LENGTH = 5

function toShortDate(date: string | null): string {
  return formatIsoDate(date).slice(0, SHORT_DATE_LENGTH)
}

function describeGroup(group: PhaseGroup): string {
  const tasks = group.countedTaskCount === 1 ? '1 tarefa' : `${group.countedTaskCount} tarefas`

  return `${tasks} · ${group.effortHours}h`
}

type GroupHeaderProps = {
  group: PhaseGroup
}

export function PhaseGroupHeader({ group }: GroupHeaderProps) {
  return (
    <div
      style={group.phase === null ? undefined : phaseColorStyle(group.phase.color)}
      className={classNames(
        'flex items-center gap-2 border-b border-border px-3 py-1.5',
        group.phase === null ? 'bg-sunken' : 'phase-tinted bg-[var(--phase-tone-soft)]',
      )}
    >
      <span
        className={classNames(
          'h-3 w-[3px] flex-none rounded-[2px]',
          group.phase === null ? 'bg-text3' : 'bg-[var(--phase-tone)]',
        )}
      />
      <span className="text-label font-semibold tracking-normal text-text">
        {group.phase?.name ?? 'Sem fase'}
      </span>
      <span className="font-mono text-micro tabular-nums text-text2">{describeGroup(group)}</span>
      {group.period !== null && (
        <span className="ml-auto font-mono text-micro tabular-nums text-text2">
          {toShortDate(group.period.start)} → {toShortDate(group.period.end)}
        </span>
      )}
    </div>
  )
}

type TaskLineProps = {
  row: ProjectTaskRow
  percentageByPerson: ReadonlyMap<EntityId, number>
  dependsOn: readonly string[]
  rowProps: GridRowProps
}

export function TaskLine({ row, percentageByPerson, dependsOn, rowProps }: TaskLineProps) {
  const { task } = row

  return (
    <div
      {...rowProps}
      role="row"
      aria-label={task.title}
      className={classNames(
        TASK_GRID_COLUMNS,
        'items-center border-b border-border px-3 py-2 hover:bg-sunken',
        FOCUS_RING,
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span title={task.title} className="truncate text-body">
          {task.title}
        </span>
        {dependsOn.map((title) => (
          <span
            key={title}
            title={`Depende de ${title}`}
            className="max-w-[104px] shrink-0 truncate rounded-badge border border-border px-[5px] font-mono text-micro text-text3"
          >
            dep. {title}
          </span>
        ))}
      </span>

      <span>
        <TaskStatusBadge status={task.status} />
      </span>

      <span className="flex min-w-0 gap-1">
        {row.people.length === 0 ? (
          row.hasOnlyEndedAllocations ? (
            <span className="font-mono text-micro text-text3">alocações encerradas</span>
          ) : (
            <UnassignedChip />
          )
        ) : (
          row.people.map((person) => (
            <PersonAllocationChip
              key={person.id}
              initials={person.initials}
              name={person.name}
              percentage={percentageByPerson.get(person.id) ?? 0}
            />
          ))
        )}
      </span>

      <span className="text-right font-mono text-support tabular-nums">
        {task.estimatedHours === null ? '—' : `${task.estimatedHours}h`}
      </span>
      <span className="text-right font-mono text-support tabular-nums text-text2">
        {formatIsoDate(task.actualStart ?? task.plannedStart)}
      </span>
      <span className="text-right font-mono text-support tabular-nums text-text2">
        {formatIsoDate(task.actualEnd ?? task.plannedEnd)}
      </span>
      <span
        className={classNames(
          'text-right font-mono text-support tabular-nums',
          row.deviationInDays !== null && row.deviationInDays > 0
            ? 'text-danger'
            : row.deviationInDays !== null && row.deviationInDays < 0
              ? 'text-ok'
              : 'text-text3',
        )}
      >
        {formatDeviation(row.deviationInDays)}
      </span>
    </div>
  )
}
