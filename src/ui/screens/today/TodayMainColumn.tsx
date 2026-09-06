import type { KeyboardEvent } from 'react'
import type { EntityId, IsoDate } from '@/domain/schemas/primitives'
import type { TodayAgenda } from '@/domain/today/todayAgenda'
import { Button } from '@/ui/primitives/Button'
import { EmptyState } from '@/ui/primitives/EmptyState'
import { KeyHint } from '@/ui/primitives/KeyHint'
import { SectionHeading } from '@/ui/primitives/SectionHeading'
import type { TodoRowFocus } from '../todos/useTodoRowFocus'
import { DueTodayList } from './DueTodayList'
import { TodayTasksCard } from './TodayTasksCard'
import type { TodayScreenStatus } from './useTodayScreenData'

const EMPTY_TITLE = 'Nada vence hoje'

type TodayMainColumnProps = {
  status: TodayScreenStatus
  errorMessage: string | null
  agenda: TodayAgenda
  today: IsoDate
  rowFocus: TodoRowFocus
  onRetry: () => void
  onToggleTodo: (todoId: EntityId) => void
  onRowKeyDown: (event: KeyboardEvent<HTMLElement>, todoId: EntityId) => void
}

export function TodayMainColumn({
  status,
  errorMessage,
  agenda,
  today,
  rowFocus,
  onRetry,
  onToggleTodo,
  onRowKeyDown,
}: TodayMainColumnProps) {
  if (status === 'loading') {
    return <p className="text-support text-text3">Carregando o dia…</p>
  }

  if (status === 'error') {
    return (
      <EmptyState
        size="large"
        title="Não foi possível abrir o dia"
        description={errorMessage ?? 'Erro desconhecido ao ler o banco.'}
        action={<Button onClick={onRetry}>Tentar de novo</Button>}
      />
    )
  }

  const taskCount = agenda.starting.length + agenda.ending.length

  if (agenda.dueTodos.length === 0 && taskCount === 0) {
    return (
      <EmptyState
        size="large"
        title={EMPTY_TITLE}
        description={
          <>
            Nenhum todo, nenhuma tarefa começando ou terminando. Use a captura rápida acima ou{' '}
            <KeyHint keys="mod+k" variant="inline" /> para abrir os comandos.
          </>
        }
      />
    )
  }

  return (
    <>
      {agenda.dueTodos.length > 0 && (
        <section className="grid gap-2">
          <SectionHeading
            title="Vencem hoje"
            count={agenda.dueTodos.length}
            rule
            trailing={
              <span className="flex items-center gap-1 text-label font-normal tracking-normal text-text3">
                marcar
                <KeyHint keys="space" variant="hint" />
              </span>
            }
          />
          <DueTodayList
            rows={agenda.dueTodos}
            today={today}
            rowFocus={rowFocus}
            onToggle={onToggleTodo}
            onRowKeyDown={onRowKeyDown}
          />
        </section>
      )}

      {taskCount > 0 && (
        <section className="grid gap-2">
          <SectionHeading title="Tarefas de hoje" count={taskCount} rule />
          <TodayTasksCard starting={agenda.starting} ending={agenda.ending} />
        </section>
      )}
    </>
  )
}
