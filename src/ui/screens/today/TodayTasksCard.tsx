import type { TodayTaskKind, TodayTaskRow } from '@/domain/today/todayAgenda'
import { Badge, type BadgeTone } from '@/ui/primitives/Badge'
import { classNames } from '@/ui/primitives/classNames'
import {
  PersonAllocationChip,
  UnassignedChip,
} from '@/ui/primitives/PersonAllocationChip'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'

const KIND_LABELS: Record<TodayTaskKind, string> = {
  start: 'início',
  end: 'fim',
  late: 'atraso',
}

const KIND_TONES: Record<TodayTaskKind, BadgeTone> = {
  start: 'accent',
  end: 'ok',
  late: 'danger',
}

const ROW_CLASSES =
  'grid grid-cols-[1fr_168px_108px_96px_76px] items-center gap-2.5 border-b border-border px-3 py-2 last:border-b-0 hover:bg-sunken'

type TodayTasksCardProps = {
  starting: readonly TodayTaskRow[]
  ending: readonly TodayTaskRow[]
}

type GroupHeaderProps = {
  label: string
  count: number
}

function GroupHeader({ label, count }: GroupHeaderProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-sunken px-3 py-1.5">
      <span className="text-label font-semibold tracking-normal text-text2">{label}</span>
      <span className="font-mono text-micro tabular-nums text-text3">{count}</span>
    </div>
  )
}

type PeopleCellProps = {
  row: TodayTaskRow
}

function PeopleCell({ row }: PeopleCellProps) {
  if (row.assignments.length > 0) {
    return (
      <span className="flex gap-1">
        {row.assignments.map((assignment) => (
          <PersonAllocationChip
            key={assignment.person.id}
            initials={assignment.person.initials}
            name={assignment.person.name}
            percentage={assignment.percentage}
          />
        ))}
      </span>
    )
  }

  return row.hasOnlyEndedAllocations ? (
    <span className="text-label font-normal tracking-normal text-text3">0 · encerradas</span>
  ) : (
    <UnassignedChip />
  )
}

function TaskRow({ row }: { row: TodayTaskRow }) {
  return (
    <div className={ROW_CLASSES}>
      <span className="inline-flex min-w-0 items-center gap-2">
        <span
          style={row.phase === null ? undefined : phaseColorStyle(row.phase.color)}
          className={classNames(
            'h-[13px] w-[3px] flex-none rounded-[2px]',
            row.phase === null ? 'bg-border-strong' : 'phase-tinted bg-[var(--phase-tone)]',
          )}
        />
        <span className="truncate text-body">{row.task.title}</span>
        {row.task.status === 'blocked' && (
          <Badge tone="danger" size="small">
            bloqueada
          </Badge>
        )}
      </span>

      <span className="truncate text-support text-text2">{row.project.name}</span>

      <PeopleCell row={row} />

      <span className="text-right font-mono text-label font-normal tabular-nums tracking-normal text-text2">
        {row.task.estimatedHours === null ? '—' : `${row.task.estimatedHours}h`}
      </span>

      <Badge tone={KIND_TONES[row.kind]} size="small" className="justify-center">
        {KIND_LABELS[row.kind]}
      </Badge>
    </div>
  )
}

export function TodayTasksCard({ starting, ending }: TodayTasksCardProps) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-panel">
      {starting.length > 0 && (
        <>
          <GroupHeader label="Começam" count={starting.length} />
          {starting.map((row) => (
            <TaskRow key={row.task.id} row={row} />
          ))}
        </>
      )}
      {ending.length > 0 && (
        <>
          <GroupHeader label="Terminam" count={ending.length} />
          {ending.map((row) => (
            <TaskRow key={row.task.id} row={row} />
          ))}
        </>
      )}
    </div>
  )
}
