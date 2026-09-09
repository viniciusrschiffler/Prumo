import type { KeyboardEvent } from 'react'
import type { EntityId } from '@/domain/schemas/primitives'
import type { TodoGroup, TodoGroupingContext } from '@/domain/todos/todoGrouping'
import { Alert } from '@/ui/primitives/Alert'
import { Button } from '@/ui/primitives/Button'
import { EmptyState } from '@/ui/primitives/EmptyState'
import type { TodosStatus } from '@/app/stores/useTodosStore'
import { buildGroupHeader } from './todoGroupStyles'
import { TodoGroupSection } from './TodoGroupSection'
import { TodoItemRow } from './TodoItemRow'
import type { TodoRowFocus } from './useTodoRowFocus'

type TodoGroupListProps = {
  status: TodosStatus
  errorMessage: string | null
  groups: readonly TodoGroup[]
  context: TodoGroupingContext
  showStatus: boolean
  hasAnyTodo: boolean
  rowFocus: TodoRowFocus
  onRetry: () => void
  onClearFilters: () => void
  onToggle: (todoId: EntityId) => void
  onEdit: (todoId: EntityId) => void
  onRowKeyDown: (event: KeyboardEvent<HTMLElement>, todoId: EntityId) => void
}

export function TodoGroupList({
  status,
  errorMessage,
  groups,
  context,
  showStatus,
  hasAnyTodo,
  rowFocus,
  onRetry,
  onClearFilters,
  onToggle,
  onEdit,
  onRowKeyDown,
}: TodoGroupListProps) {
  if (status === 'error') {
    return (
      <Alert
        level="danger"
        title="Não foi possível abrir a lista"
        action={
          <Button variant="danger" size="small" onClick={onRetry}>
            Tentar de novo
          </Button>
        }
      >
        {errorMessage}
      </Alert>
    )
  }

  if (status !== 'ready') {
    return <p className="text-support text-text3">Carregando os todos…</p>
  }

  if (!hasAnyTodo) {
    return (
      <EmptyState
        size="large"
        title="Nenhum todo em aberto"
        description={
          <>
            Capture o próximo na barra acima. Tudo que você escrever fica em{' '}
            <span className="font-mono text-meta">prumo.db</span> na sua pasta local.
          </>
        }
      />
    )
  }

  if (groups.length === 0) {
    return (
      <EmptyState
        size="large"
        title="Nenhum todo neste filtro"
        description="Ajuste a tag na barra lateral ou mostre os concluídos para ver o resto."
        action={<Button onClick={onClearFilters}>Limpar filtros</Button>}
      />
    )
  }

  return (
    <>
      {groups.map((group) => {
        const header = buildGroupHeader(group, context)

        return (
          <TodoGroupSection
            key={group.id}
            title={header.title}
            count={group.items.length}
            meta={header.meta}
            tone={header.tone}
            titleTone={header.titleTone}
            phaseColor={header.phaseColor}
          >
            <div role="list" aria-label={header.title}>
              {group.items.map((row) => (
                <TodoItemRow
                  key={row.todo.id}
                  row={row}
                  context={context}
                  showStatus={showStatus}
                  registerRef={rowFocus.registerRef}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onKeyDown={onRowKeyDown}
                />
              ))}
            </div>
          </TodoGroupSection>
        )
      })}
    </>
  )
}
