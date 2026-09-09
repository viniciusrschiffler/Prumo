import { addDays } from '@/domain/dates/isoDateMath'
import type { IsoDate, IsoDateTime } from '@/domain/schemas/primitives'
import type { Todo, TodoBoardStatus } from '@/domain/schemas/todoSchema'

// Nenhuma ação do app grava o status cancelado, então o que se escreve é sempre coluna do quadro.
export type TodoCompletion = {
  status: TodoBoardStatus
  completedAt: IsoDateTime | null
}

// Adiar o que já venceu para o dia seguinte ao vencimento devolveria uma data ainda no
// passado, e o item continuaria em Atrasados.
export function snoozeDueDate(dueDate: IsoDate | null, today: IsoDate): IsoDate {
  return dueDate === null || dueDate <= today ? addDays(today, 1) : addDays(dueDate, 1)
}

// A tabela recusa data de conclusão em quem não está concluído, então quem decide as duas
// colunas é uma função só: o quadro, a caixa de marcar e o formulário passam por aqui.
export function buildTodoStatusChange(
  status: TodoBoardStatus,
  now: IsoDateTime,
  completedAt: IsoDateTime | null = null,
): TodoCompletion {
  if (status !== 'done') {
    return { status, completedAt: null }
  }

  return { status, completedAt: completedAt ?? now }
}

// Desmarcar devolve o item a "Em progresso", como o mockup do quadro faz: quem tirou o visto
// voltou a trabalhar nele, e o schema não guarda de qual coluna ele saiu.
export function buildTodoCompletion(todo: Todo, now: IsoDateTime): TodoCompletion {
  return buildTodoStatusChange(todo.status === 'done' ? 'in_progress' : 'done', now)
}
