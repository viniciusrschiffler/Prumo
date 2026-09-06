import { useCallback, useRef, type KeyboardEvent } from 'react'
import type { NoteTreeNode } from '@/domain/notes/noteTree'
import { EmptyState } from '@/ui/primitives/EmptyState'
import { IconButton } from '@/ui/primitives/IconButton'
import { Input } from '@/ui/primitives/Input'
import { NoteTreeRow } from './NoteTreeRow'
import { formatTreeTotals } from './noteLabels'

const SEARCH_PLACEHOLDER = 'Buscar no conteúdo'

type NoteTreePanelProps = {
  nodes: readonly NoteTreeNode[]
  phaseColorOf: (path: string) => string | null
  selectedPath: string | null
  searchText: string
  isFiltered: boolean
  onSelect: (node: NoteTreeNode) => void
  onSearch: (text: string) => void
  onNewFolder: () => void
}

export function NoteTreePanel({
  nodes,
  phaseColorOf,
  selectedPath,
  searchText,
  isFiltered,
  onSelect,
  onSearch,
  onNewFolder,
}: NoteTreePanelProps) {
  const listRef = useRef<HTMLDivElement>(null)

  // A árvore é uma lista só: a seta anda linha a linha, pasta incluída, que é o que o recuo
  // já promete ao olho.
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return
    }

    const rows = [...(listRef.current?.querySelectorAll('button') ?? [])]
    const current = rows.indexOf(event.currentTarget)
    const next = rows[current + (event.key === 'ArrowDown' ? 1 : -1)]

    if (next !== undefined) {
      event.preventDefault()
      next.focus()
    }
  }, [])

  return (
    <div className="flex flex-col overflow-hidden border-r border-border bg-sunken">
      <div className="grid flex-none gap-2 border-b border-border px-3 pb-2.5 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-label uppercase text-text2">Árvore</span>
          <IconButton size="compact" label="Nova pasta" className="ml-auto" onClick={onNewFolder}>
            +
          </IconButton>
        </div>
        <Input
          type="search"
          fieldSize="dense"
          textSize="support"
          value={searchText}
          placeholder={SEARCH_PLACEHOLDER}
          aria-label={SEARCH_PLACEHOLDER}
          onChange={(event) => onSearch(event.target.value)}
        />
      </div>

      <div
        ref={listRef}
        role="tree"
        aria-label="Notas"
        className="grid flex-1 content-start gap-px overflow-auto p-2"
      >
        {nodes.length === 0 ? (
          <EmptyState
            title={isFiltered ? 'Nada encontrado' : 'Nenhuma nota ainda'}
            description={
              isFiltered
                ? 'Nenhum arquivo desta pasta casa com o filtro e a busca de agora.'
                : 'As notas são arquivos .md na sua pasta de dados. Crie a primeira com ⌘N.'
            }
          />
        ) : (
          nodes.map((node) => (
            <NoteTreeRow
              key={node.path}
              node={node}
              phaseColor={phaseColorOf(node.path)}
              isSelected={node.path === selectedPath}
              onSelect={() => onSelect(node)}
              onKeyDown={handleKeyDown}
            />
          ))
        )}
      </div>

      <div className="flex-none border-t border-border px-3 py-2 font-mono text-micro text-text3">
        {formatTreeTotals(nodes)}
      </div>
    </div>
  )
}
