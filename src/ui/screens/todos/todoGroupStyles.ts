import { formatShortDate, formatWeekdayShortDate } from '@/domain/format/dueLabel'
import type { DueGroupBucket, TodoGroup, TodoGroupingContext } from '@/domain/todos/todoGrouping'
import { endOfCurrentWeek } from '@/domain/todos/todoGrouping'
import type { Priority } from '@/domain/schemas/primitives'
import type { TodoBoardStatus } from '@/domain/schemas/todoSchema'
import { DUE_GROUP_LABELS, PRIORITY_LABELS, TODO_STATUS_LABELS } from '@/ui/labels/entityLabels'
import type { TodoGroupTone, TodoGroupTitleTone } from './TodoGroupSection'

export type TodoGroupHeader = {
  title: string
  meta: string | null
  tone: TodoGroupTone
  titleTone: TodoGroupTitleTone
  phaseColor: string | null
}

const DUE_TONES: Record<DueGroupBucket, TodoGroupTone> = {
  late: 'danger',
  today: 'accent',
  week: 'neutral',
  later: 'neutral',
  none: 'neutral',
  doneToday: 'ok',
  doneBefore: 'ok',
}

const DUE_TITLE_TONES: Record<DueGroupBucket, TodoGroupTitleTone> = {
  late: 'danger',
  today: 'default',
  week: 'muted',
  later: 'muted',
  none: 'muted',
  doneToday: 'ok',
  doneBefore: 'ok',
}

const STATUS_TONES: Record<TodoBoardStatus, TodoGroupTone> = {
  open: 'neutral',
  in_progress: 'info',
  blocked: 'danger',
  done: 'ok',
}

const STATUS_TITLE_TONES: Record<TodoBoardStatus, TodoGroupTitleTone> = {
  open: 'muted',
  in_progress: 'info',
  blocked: 'danger',
  done: 'ok',
}

const PRIORITY_TONES: Record<Priority, TodoGroupTone> = {
  P0: 'danger',
  P1: 'warn',
  P2: 'neutral',
  P3: 'neutral',
}

function toDueMeta(bucket: DueGroupBucket, context: TodoGroupingContext): string | null {
  if (bucket === 'late') {
    return 'resolver ou adiar'
  }

  if (bucket === 'today') {
    return formatWeekdayShortDate(context.today)
  }

  if (bucket === 'week') {
    return `até ${formatShortDate(endOfCurrentWeek(context))}`
  }

  return bucket === 'none' ? 'backlog pessoal' : null
}

export function buildGroupHeader(
  group: TodoGroup,
  context: TodoGroupingContext,
): TodoGroupHeader {
  if (group.kind === 'status') {
    return {
      title: TODO_STATUS_LABELS[group.status],
      meta: null,
      tone: STATUS_TONES[group.status],
      titleTone: STATUS_TITLE_TONES[group.status],
      phaseColor: null,
    }
  }

  if (group.kind === 'due') {
    return {
      title: DUE_GROUP_LABELS[group.bucket],
      meta: toDueMeta(group.bucket, context),
      tone: DUE_TONES[group.bucket],
      titleTone: DUE_TITLE_TONES[group.bucket],
      phaseColor: null,
    }
  }

  if (group.kind === 'priority') {
    return {
      title: `${group.priority} · ${PRIORITY_LABELS[group.priority]}`,
      meta: null,
      tone: PRIORITY_TONES[group.priority],
      titleTone: 'muted',
      phaseColor: null,
    }
  }

  return {
    title: group.project?.name ?? 'Sem projeto',
    meta: null,
    tone: group.phase === null ? 'neutral' : 'phase',
    titleTone: 'muted',
    phaseColor: group.phase?.color ?? null,
  }
}
