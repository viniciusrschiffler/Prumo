import type { TimelineGrouping } from '@/domain/timeline/timelineRows'
import { classNames } from '@/ui/primitives/classNames'
import { formatConflictCount, formatRowCounts } from './timelineLabels'

type TimelineFooterProps = {
  grouping: TimelineGrouping
  groupCount: number
  itemCount: number
  conflictCount: number
  dragLabel: string | null
}

export function TimelineFooter({
  grouping,
  groupCount,
  itemCount,
  conflictCount,
  dragLabel,
}: TimelineFooterProps) {
  return (
    <footer className="flex flex-none items-center gap-4 border-t border-border bg-panel px-5 py-2 text-label font-normal tracking-normal text-text2">
      <span>{formatRowCounts(grouping, groupCount, itemCount)}</span>
      {dragLabel !== null && (
        <span className="font-mono tabular-nums text-accent">{dragLabel}</span>
      )}
      <span
        className={classNames(
          'ml-auto font-mono tabular-nums',
          conflictCount === 0 ? 'text-text3' : 'text-danger',
        )}
      >
        {conflictCount === 0 ? 'nenhum conflito de alocação' : formatConflictCount(conflictCount)}
      </span>
    </footer>
  )
}
