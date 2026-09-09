import { addDays } from '@/domain/dates/isoDateMath'
import type { EntityId, IsoDate, Priority } from '@/domain/schemas/primitives'
import type { TodoBoardStatus } from '@/domain/schemas/todoSchema'
import {
  buildTodoGroups,
  endOfCurrentWeek,
  type TodoGroup,
  type TodoGroupingContext,
  type TodoGroupMode,
} from './todoGrouping'
import type { ProjectWithPhase, TodoRow } from './todoRow'

// O que o arrasto grava é o campo do agrupamento em vigor, como o rodapé do modal promete.
export type TodoBoardDrop =
  | { kind: 'status'; status: TodoBoardStatus }
  | { kind: 'priority'; priority: Priority }
  | { kind: 'project'; projectId: EntityId | null }
  | { kind: 'due'; dueDate: IsoDate | null }

export type TodoBoardColumn = {
  group: TodoGroup
  // Coluna sem destino é histórico ou consequência, não lugar para onde se arrasta: nada
  // torna um item atrasado por escolha, e "Concluídos antes" é uma data que já passou.
  drop: TodoBoardDrop | null
}

function toDrop(group: TodoGroup, context: TodoGroupingContext): TodoBoardDrop | null {
  if (group.kind === 'status') {
    return { kind: 'status', status: group.status }
  }

  if (group.kind === 'priority') {
    return { kind: 'priority', priority: group.priority }
  }

  if (group.kind === 'project') {
    return { kind: 'project', projectId: group.project?.id ?? null }
  }

  if (group.bucket === 'today') {
    return { kind: 'due', dueDate: context.today }
  }

  if (group.bucket === 'week') {
    return { kind: 'due', dueDate: endOfCurrentWeek(context) }
  }

  if (group.bucket === 'later') {
    return { kind: 'due', dueDate: addDays(endOfCurrentWeek(context), 1) }
  }

  if (group.bucket === 'none') {
    return { kind: 'due', dueDate: null }
  }

  if (group.bucket === 'doneToday') {
    return { kind: 'status', status: 'done' }
  }

  return null
}

// A coluna vazia só fica em pé se dá para arrastar para ela; a que só recebe pelo passar do
// tempo aparece quando tem o que mostrar.
export function buildTodoBoard(
  rows: readonly TodoRow[],
  mode: TodoGroupMode,
  context: TodoGroupingContext,
  projects: readonly ProjectWithPhase[],
): TodoBoardColumn[] {
  return buildTodoGroups(rows, mode, context, projects)
    .map((group) => ({ group, drop: toDrop(group, context) }))
    .filter((column) => column.drop !== null || column.group.items.length > 0)
}
