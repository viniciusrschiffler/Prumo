import type { CapacityUnit } from '@/domain/capacity/capacityUnit'
import type { CapacityMatrix } from '@/domain/capacity/capacityMatrix'
import type { CapacityWindow } from '@/domain/capacity/capacityWindow'
import { classNames } from '@/ui/primitives/classNames'
import { FOCUS_RING } from '@/ui/primitives/focusRing'
import type { MatrixPosition } from '@/ui/primitives/gridNavigationKeys'
import { PersonAvatar } from '@/ui/primitives/PersonAvatar'
import type { MatrixNavigation } from '@/ui/primitives/useMatrixNavigation'
import { HEAT_SURFACE_CLASSES } from './capacityHeatStyle'
import {
  describeCellLoad,
  formatCellValue,
  formatHours,
  formatUnitValue,
  formatWeek,
} from './capacityLabels'

const CURRENT_WEEK_MARK = 'shadow-[inset_2px_0_0_var(--accent)]'

type CapacityMatrixTableProps = {
  matrix: CapacityMatrix
  window: CapacityWindow
  unit: CapacityUnit
  selection: MatrixPosition
  navigation: MatrixNavigation
  onSelect: (position: MatrixPosition) => void
}

function gridTemplate(weekCount: number): string {
  return `168px repeat(${weekCount}, minmax(0, 1fr)) 64px`
}

export function CapacityMatrixTable({
  matrix,
  window,
  unit,
  selection,
  navigation,
  onSelect,
}: CapacityMatrixTableProps) {
  const columns = { gridTemplateColumns: gridTemplate(window.weeks.length) }

  return (
    <div
      role="grid"
      aria-label="Capacidade por pessoa e semana"
      aria-rowcount={matrix.rows.length}
      aria-colcount={window.weeks.length}
      className="overflow-hidden rounded-card border border-border bg-panel"
    >
      <div
        role="row"
        style={columns}
        className="grid border-b border-border bg-sunken"
      >
        <span
          role="columnheader"
          className="border-r border-border px-2.5 py-[7px] text-column uppercase text-text2"
        >
          Pessoa
        </span>
        {window.weeks.map((week) => (
          <span
            key={week.index}
            role="columnheader"
            className={classNames(
              'py-[7px] text-center font-mono text-micro',
              week.isCurrent ? classNames('font-semibold text-text', CURRENT_WEEK_MARK) : 'text-text3',
            )}
          >
            {formatWeek(week.number)}
          </span>
        ))}
        <span
          role="columnheader"
          className="border-l border-border px-2 py-[7px] text-right text-column uppercase text-text2"
        >
          Média
        </span>
      </div>

      {matrix.rows.map((row, rowIndex) => (
        <div
          key={row.person.id}
          role="row"
          style={columns}
          className="grid items-stretch border-b border-border hover:bg-sunken"
        >
          <span
            role="rowheader"
            className="flex h-[34px] items-center gap-[7px] border-r border-border px-2.5"
          >
            <PersonAvatar
              initials={row.person.initials}
              size="small"
              tone={row.isOverloaded ? 'danger' : 'default'}
            />
            <span
              className={classNames(
                'truncate text-support',
                row.person.active ? 'text-text' : 'text-text3',
              )}
            >
              {row.person.name}
            </span>
            <span className="ml-auto whitespace-nowrap font-mono text-micro text-text3">
              {row.person.active ? formatHours(row.person.weeklyCapacityHours) : 'inativa'}
            </span>
          </span>

          {row.cells.map((cell) => {
            const isSelected =
              selection.row === rowIndex && selection.column === cell.weekIndex
            const week = window.weeks[cell.weekIndex]

            return (
              <button
                key={cell.weekIndex}
                type="button"
                role="gridcell"
                aria-selected={isSelected}
                aria-label={`${row.person.name}, ${formatWeek(week?.number ?? 0)}: ${describeCellLoad(
                  cell.percentage,
                  row.person.active,
                )}`}
                {...navigation.getCellProps({ row: rowIndex, column: cell.weekIndex })}
                onClick={() => onSelect({ row: rowIndex, column: cell.weekIndex })}
                style={{ borderRightColor: 'var(--border)' }}
                className={classNames(
                  'flex items-center justify-center border font-mono text-meta tabular-nums',
                  HEAT_SURFACE_CLASSES[cell.level],
                  isSelected ? 'shadow-[inset_0_0_0_2px_var(--accent)]' : '',
                  FOCUS_RING,
                )}
              >
                {formatCellValue(cell.percentage, cell.hours, unit, row.person.active)}
              </button>
            )
          })}

          <span
            role="gridcell"
            className={classNames(
              'flex items-center justify-end border-l border-border px-2 font-mono text-meta font-semibold tabular-nums',
              row.isOverloaded ? 'text-danger' : 'text-text2',
            )}
          >
            {row.person.active
              ? formatUnitValue(row.averagePercentage, row.averageHours, unit)
              : '—'}
          </span>
        </div>
      ))}

      <div role="row" style={columns} className="grid bg-sunken">
        <span
          role="rowheader"
          className="flex h-[30px] items-center border-r border-border px-2.5 text-label font-semibold tracking-normal text-text2"
        >
          {`Time · ${formatHours(matrix.teamWeeklyCapacityHours)}/sem`}
        </span>
        {matrix.totals.map((total) => (
          <span
            key={total.weekIndex}
            role="gridcell"
            className={classNames(
              'flex items-center justify-center border-r border-border font-mono text-meta tabular-nums',
              total.isOver ? 'text-danger' : 'text-text2',
            )}
          >
            {formatUnitValue(total.percentage, total.hours, unit)}
          </span>
        ))}
        <span
          role="gridcell"
          className="flex items-center justify-end border-l border-border px-2 font-mono text-meta font-semibold tabular-nums"
        >
          {formatUnitValue(matrix.teamAveragePercentage, matrix.teamAverageHours, unit)}
        </span>
      </div>
    </div>
  )
}
