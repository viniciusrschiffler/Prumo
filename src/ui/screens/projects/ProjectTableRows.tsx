import type { ProjectRow, ProjectTaskRow } from '@/domain/projects/projectRow'
import { formatIsoDate } from '@/domain/format/displayDate'
import { formatDeviation } from '@/domain/format/formatDeviation'
import { Badge } from '@/ui/primitives/Badge'
import { classNames } from '@/ui/primitives/classNames'
import { IconButton } from '@/ui/primitives/IconButton'
import { PersonStack } from '@/ui/primitives/PersonStack'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'
import { ProgressBar, type ProgressTone } from '@/ui/primitives/ProgressBar'
import { ProjectStatusBadge, TaskStatusBadge } from '@/ui/primitives/StatusBadge'
import { TableCell } from '@/ui/primitives/TableCell'
import type { GridRowProps } from '@/ui/primitives/useGridNavigation'

const EMPTY_MARK = '—'
const PERCENT_BASE = 100

function toPercentLabel(ratio: number): string {
  return `${Math.round(ratio * PERCENT_BASE)}%`
}

function deviationToneClass(deviationInDays: number | null): string {
  if (deviationInDays === null || deviationInDays === 0) {
    return 'text-text3'
  }

  return deviationInDays > 0 ? 'text-danger' : 'text-ok'
}

function PhaseCell({ name, color }: { name: string | null; color: string | null }) {
  if (name === null || color === null) {
    return <span className="text-support text-text3">{EMPTY_MARK}</span>
  }

  return (
    <span
      style={phaseColorStyle(color)}
      className="phase-tinted inline-flex items-center gap-1.5 whitespace-nowrap text-support text-text2"
    >
      <span className="h-[7px] w-[7px] flex-none rounded-[2px] bg-[var(--phase-tone)]" />
      {name}
    </span>
  )
}

type ProjectTableRowProps = {
  row: ProjectRow
  byHours: boolean
  expanded: boolean
  selected: boolean
  rowProps: GridRowProps
  onToggleExpand: () => void
  onSelect: (extend: boolean) => void
  onOpen: () => void
}

export function ProjectTableRow({
  row,
  byHours,
  expanded,
  selected,
  rowProps,
  onToggleExpand,
  onSelect,
  onOpen,
}: ProjectTableRowProps) {
  const { project } = row
  const isCancelled = project.status === 'cancelled'
  const isBlocked = project.status === 'blocked'
  const hasTasks = row.tasks.length > 0
  const progress = byHours ? row.hoursProgress.ratio : row.taskProgress.ratio
  const effortLabel = byHours ? `${row.effortHours}h` : `${row.countedTaskCount} tar`

  return (
    <tr
      {...rowProps}
      role="row"
      aria-selected={selected}
      aria-expanded={hasTasks ? expanded : undefined}
      onClick={(event) => (event.shiftKey ? onSelect(true) : undefined)}
      onDoubleClick={onOpen}
      className={classNames(
        'outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--accent)]',
        selected ? 'bg-accent-soft' : 'hover:bg-sunken',
      )}
    >
      <TableCell>
        <div className="flex items-center gap-[7px]">
          {hasTasks ? (
            <IconButton
              size="small"
              label={expanded ? `Recolher ${project.name}` : `Expandir ${project.name}`}
              tabIndex={-1}
              onClick={onToggleExpand}
            >
              {expanded ? '▼' : '►'}
            </IconButton>
          ) : (
            <span className="h-4 w-4 flex-none" />
          )}
          <span
            className={classNames(
              'truncate font-medium',
              isCancelled ? 'text-text3 line-through' : 'text-text',
            )}
          >
            {project.name}
          </span>
          {hasTasks && (
            <span className="font-mono text-micro text-text3">{row.countedTaskCount}</span>
          )}
        </div>
      </TableCell>

      <TableCell>
        <ProjectStatusBadge status={project.status} size="small" dot={false} />
      </TableCell>

      <TableCell>
        <PhaseCell name={row.currentPhase?.name ?? null} color={row.currentPhase?.color ?? null} />
      </TableCell>

      <TableCell
        numeric
        className={
          project.priority === 'P0' ? 'text-danger' : isCancelled ? 'text-text3' : 'text-text'
        }
      >
        {project.priority}
      </TableCell>

      <TableCell numeric className={hasTasks ? 'text-text' : 'text-text3'}>
        {hasTasks ? (
          <>
            <span className="text-text3">∑ </span>
            {effortLabel}
          </>
        ) : (
          EMPTY_MARK
        )}
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-[7px]">
          <ProgressBar
            value={progress}
            tone={isBlocked ? 'muted' : 'default'}
            hatched={isBlocked}
            className="w-16 flex-none"
          />
          <span className="font-mono text-label font-normal tabular-nums tracking-normal text-text2">
            {hasTasks ? toPercentLabel(progress) : EMPTY_MARK}
          </span>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-[3px]">
          <PersonStack
            people={row.people.map((person) => ({
              id: person.id,
              initials: person.initials,
              name: person.name,
            }))}
            maxVisible={3}
          />
          <span className="whitespace-nowrap font-mono text-label font-normal tabular-nums tracking-normal text-text3">
            {row.hasOnlyEndedAllocations
              ? '0 · encerradas'
              : row.people.length === 0
                ? EMPTY_MARK
                : ''}
          </span>
        </div>
      </TableCell>

      <TableCell numeric className={isCancelled ? 'text-text3' : 'text-text2'}>
        {formatIsoDate(row.period?.start ?? null)}
      </TableCell>

      <TableCell numeric className={isCancelled ? 'text-text3' : 'text-text2'}>
        {formatIsoDate(row.period?.end ?? null)}
      </TableCell>

      <TableCell numeric className={deviationToneClass(row.deviationInDays)}>
        {formatDeviation(row.deviationInDays)}
      </TableCell>
    </tr>
  )
}

function taskProgressTone(status: ProjectTaskRow['task']['status']): ProgressTone {
  if (status === 'done') {
    return 'ok'
  }

  return status === 'blocked' ? 'muted' : 'default'
}

function taskTagLabel(row: ProjectTaskRow): string | null {
  if (row.people.length > 0) {
    return null
  }

  if (row.hasOnlyEndedAllocations) {
    return 'encerrada'
  }

  return row.isPlanned ? 'sem resp.' : 'a planejar'
}

export function TaskTableRow({ row }: { row: ProjectTaskRow }) {
  const { task } = row
  const isDone = task.status === 'done'
  const isBlocked = task.status === 'blocked'
  const tagLabel = taskTagLabel(row)
  const isMissingOwner = tagLabel === 'sem resp.'

  return (
    <tr className="bg-sunken">
      <TableCell>
        <div className="flex items-center gap-[7px] pl-6">
          <span
            style={phaseColorStyle(row.phase?.color ?? 'oklch(0.645 0.012 265)')}
            className="phase-tinted h-3 w-[3px] flex-none rounded-[2px] bg-[var(--phase-tone)]"
          />
          <span className="truncate text-support text-text2">{task.title}</span>
          {tagLabel !== null && (
            <Badge
              variant="outline"
              tone={isMissingOwner ? 'warn' : 'neutral'}
              size="small"
              dashed={isMissingOwner}
              className={classNames(
                'flex-none whitespace-nowrap font-mono font-normal',
                isMissingOwner ? 'bg-warn-soft' : '',
              )}
            >
              {tagLabel}
            </Badge>
          )}
        </div>
      </TableCell>

      <TableCell>
        <TaskStatusBadge status={task.status} />
      </TableCell>

      <TableCell>
        <span className="whitespace-nowrap text-support text-text3">
          {row.phase?.name ?? EMPTY_MARK}
        </span>
      </TableCell>

      <TableCell />

      <TableCell numeric className="text-text2">
        {task.estimatedHours === null ? EMPTY_MARK : `${task.estimatedHours}h`}
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-[7px]">
          <ProgressBar
            value={isDone ? 1 : 0}
            tone={taskProgressTone(task.status)}
            track="border"
            hatched={isBlocked}
            className="w-16 flex-none"
          />
          <span className="font-mono text-label font-normal tabular-nums tracking-normal text-text2">
            {isDone ? '100%' : '0%'}
          </span>
        </div>
      </TableCell>

      <TableCell>
        <PersonStack
          people={row.people.map((person) => ({
            id: person.id,
            initials: person.initials,
            name: person.name,
          }))}
          maxVisible={3}
          size="tiny"
        />
      </TableCell>

      <TableCell numeric className="text-text3">
        {formatIsoDate(task.actualStart ?? task.plannedStart)}
      </TableCell>

      <TableCell numeric className="text-text3">
        {formatIsoDate(task.actualEnd ?? task.plannedEnd)}
      </TableCell>

      <TableCell numeric className={deviationToneClass(row.deviationInDays)}>
        {formatDeviation(row.deviationInDays)}
      </TableCell>
    </tr>
  )
}
