import type { BlockedMonth, BlockedProjectRow } from '@/domain/dashboards/blockedDays'
import { classNames } from '@/ui/primitives/classNames'
import { PhaseStripe } from '@/ui/primitives/PhaseStripe'
import { ChartCard } from './ChartCard'
import { formatDays, formatMonthAbbreviation } from './dashboardLabels'

const HATCH_CLASSES =
  'bg-[repeating-linear-gradient(45deg,transparent_0_3px,var(--hatch)_3px_6px)]'
const TALLEST_BAR_PIXELS = 72
const SHORTEST_BAR_PIXELS = 3

type BlockedDaysChartProps = {
  months: readonly BlockedMonth[]
  projects: readonly BlockedProjectRow[]
  totalDays: number
}

function MonthColumn({ month, scale }: { month: BlockedMonth; scale: number }) {
  const isBlocked = month.blockedDays > 0

  return (
    <div className="grid h-full flex-1 content-end justify-items-center gap-[5px]">
      <span
        className={classNames(
          'font-mono text-micro tabular-nums',
          isBlocked ? 'text-danger' : 'text-text3',
        )}
      >
        {isBlocked ? month.blockedDays : '·'}
      </span>
      <div
        style={{
          height: `${Math.max(SHORTEST_BAR_PIXELS, (month.blockedDays / scale) * TALLEST_BAR_PIXELS)}px`,
        }}
        className={classNames(
          'w-full rounded-t-[3px] border',
          isBlocked ? 'border-danger bg-danger-soft' : 'border-border bg-sunken',
          isBlocked ? HATCH_CLASSES : '',
        )}
      />
      <span className="font-mono text-micro text-text3">
        {formatMonthAbbreviation(month.monthStart)}
      </span>
    </div>
  )
}

export function BlockedDaysChart({ months, projects, totalDays }: BlockedDaysChartProps) {
  const scale = Math.max(1, ...months.map((month) => month.blockedDays))
  const worstDays = Math.max(0, ...projects.map((project) => project.blockedDays))

  return (
    <ChartCard
      title="Dias de projeto bloqueado"
      total={`${formatDays(totalDays)} no período`}
      totalTone={totalDays > 0 ? 'danger' : 'default'}
    >
      <div className="flex h-[104px] items-end gap-1.5">
        {months.map((month) => (
          <MonthColumn key={month.monthStart} month={month} scale={scale} />
        ))}
      </div>
      <div className="grid gap-[5px]">
        {projects.map((project) => (
          <div
            key={project.projectId}
            className="flex items-center gap-[7px] text-meta text-text2"
          >
            <PhaseStripe color={project.phaseColor} size="small" />
            <span className="truncate">{project.name}</span>
            <span
              className={classNames(
                'ml-auto font-mono tabular-nums',
                project.blockedDays === worstDays ? 'text-danger' : 'text-text2',
              )}
            >
              {formatDays(project.blockedDays)}
            </span>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}
