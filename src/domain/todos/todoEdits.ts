import { addDays } from '@/domain/dates/isoDateMath'
import type { IsoDate, IsoDateTime } from '@/domain/schemas/primitives'
import type { Todo, TodoStatus } from '@/domain/schemas/todoSchema'

export type TodoCompletion = {
  status: TodoStatus
  completedAt: IsoDateTime | null
}

// Adiar o que já venceu para o dia seguinte ao vencimento devolveria uma data ainda no
// passado, e o item continuaria em Atrasados.
export function snoozeDueDate(dueDate: IsoDate | null, today: IsoDate): IsoDate {
  return dueDate === null || dueDate <= today ? addDays(today, 1) : addDays(dueDate, 1)
}

export function buildTodoCompletion(todo: Todo, now: IsoDateTime): TodoCompletion {
  return todo.status === 'done'
    ? { status: 'open', completedAt: null }
    : { status: 'done', completedAt: now }
}
