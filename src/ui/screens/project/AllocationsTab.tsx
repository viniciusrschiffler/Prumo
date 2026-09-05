import type { AllocationConflict } from '@/domain/projects/allocationConflicts'
import type { AllocationRow } from '@/domain/projects/allocationRows'
import { formatIsoDate } from '@/domain/format/displayDate'
import { classNames } from '@/ui/primitives/classNames'
import { EmptyState } from '@/ui/primitives/EmptyState'
import { FOCUS_RING } from '@/ui/primitives/focusRing'
import { PersonAvatar } from '@/ui/primitives/PersonAvatar'
import { useGridNavigation } from '@/ui/primitives/useGridNavigation'
import { AllocationConflictAlert } from './AllocationConflictAlert'

const GRID_COLUMNS = 'grid grid-cols-[minmax(0,1fr)_150px_100px_100px_96px_90px] gap-2.5'

const COLUMNS = [
  { label: 'Pessoa', numeric: false },
  { label: 'Tarefa', numeric: false },
  { label: 'Alocação', numeric: true },
  { label: 'Capacidade', numeric: true },
  { label: 'Início', numeric: true },
  { label: 'Fim', numeric: true },
] as const

function isOverloadedInConflict(
  row: AllocationRow,
  conflicts: readonly AllocationConflict[],
): boolean {
  return conflicts.some((conflict) =>
    conflict.contributions.some(
      (contribution) => contribution.allocation.id === row.allocation.id,
    ),
  )
}

type AllocationsTabProps = {
  rows: readonly AllocationRow[]
  conflicts: readonly AllocationConflict[]
}

export function AllocationsTab({ rows, conflicts }: AllocationsTabProps) {
  const navigation = useGridNavigation({ rowIds: rows.map((row) => row.allocation.id) })

  return (
    <div className="grid gap-3.5">
      {conflicts.map((conflict) => (
        <AllocationConflictAlert
          key={`${conflict.person.id}-${conflict.period.start}`}
          conflict={conflict}
        />
      ))}

      {rows.length === 0 ? (
        <EmptyState
          title="Nenhuma alocação ainda"
          description="Atribua pessoas às tarefas do projeto para que a capacidade semanal passe a ser medida."
        />
      ) : (
        <div
          role="table"
          aria-label="Alocações do projeto"
          className="overflow-hidden rounded-card border border-border bg-panel"
        >
          <div
            role="row"
            className={`${GRID_COLUMNS} border-b border-border bg-sunken px-3 py-[7px] text-column uppercase text-text2`}
          >
            {COLUMNS.map((column) => (
              <span role="columnheader" key={column.label} className={column.numeric ? 'text-right' : undefined}>
                {column.label}
              </span>
            ))}
          </div>

          {rows.map((row) => {
            const isOverloaded = isOverloadedInConflict(row, conflicts)
            const muted = row.isEnded ? 'text-text3' : 'text-text2'

            return (
              <div
                {...navigation.getRowProps(row.allocation.id)}
                key={row.allocation.id}
                role="row"
                aria-label={`${row.person?.name ?? 'Pessoa removida'} em ${row.task?.title ?? 'tarefa removida'}`}
                title={row.allocation.endedReason ?? undefined}
                className={classNames(
                  GRID_COLUMNS,
                  'items-center border-b border-border px-3 py-2 last:border-b-0 hover:bg-sunken',
                  FOCUS_RING,
                )}
              >
                <span role="cell" className="flex min-w-0 items-center gap-[7px]">
                  <PersonAvatar
                    initials={row.person?.initials ?? '—'}
                    name={row.person?.name}
                    tone={isOverloaded ? 'warn' : 'default'}
                    size="small"
                  />
                  <span
                    className={classNames(
                      'truncate text-body',
                      row.isEnded ? 'text-text3' : 'text-text',
                    )}
                  >
                    {row.person?.name ?? 'Pessoa removida'}
                  </span>
                </span>

                <span role="cell" className={classNames('truncate text-support', muted)}>
                  {row.task?.title ?? 'Tarefa removida'}
                </span>

                <span
                  role="cell"
                  className={classNames(
                    'text-right font-mono text-support tabular-nums',
                    row.isEnded ? 'text-text3' : isOverloaded ? 'text-warn' : 'text-text',
                  )}
                >
                  {row.allocation.percentage}%
                </span>

                <span
                  role="cell"
                  className={classNames('text-right font-mono text-support tabular-nums', muted)}
                >
                  {row.consumedWeeklyHours}h/sem
                </span>
                <span
                  role="cell"
                  className={classNames('text-right font-mono text-support tabular-nums', muted)}
                >
                  {formatIsoDate(row.allocation.startDate)}
                </span>
                <span
                  role="cell"
                  className={classNames('text-right font-mono text-support tabular-nums', muted)}
                >
                  {formatIsoDate(row.allocation.endDate)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
