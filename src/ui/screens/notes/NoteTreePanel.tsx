import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { listAncestorFolders } from '@/domain/notes/notePath'
import {
  collapseNoteTree,
  resolveTargetFolder,
  type NoteTreeNode,
} from '@/domain/notes/noteTree'
import { EmptyState } from '@/ui/primitives/EmptyState'
import { IconButton } from '@/ui/primitives/IconButton'
import { Input } from '@/ui/primitives/Input'
import { formatTreeTotals } from './noteLabels'
import {
  NoteTreeContextMenu,
  type NoteContextAction,
  type NoteContextAnchor,
} from './NoteTreeContextMenu'
import { NoteTreeRow } from './NoteTreeRow'

const SEARCH_PLACEHOLDER = 'Buscar no conteúdo'

type OpenMenu = {
  anchor: NoteContextAnchor
  node: NoteTreeNode | null
}

type NoteTreePanelProps = {
  nodes: readonly NoteTreeNode[]
  phaseColorOf: (path: string) => string | null
  selectedPath: string | null
  targetFolderPath: string
  searchText: string
  isFiltered: boolean
  onSelect: (node: NoteTreeNode) => void
  onSearch: (text: string) => void
  onNewNote: (folderPath: string) => void
  onNewFolder: (parentPath: string) => void
  onDelete: (node: NoteTreeNode) => void
}

export function NoteTreePanel({
  nodes,
  phaseColorOf,
  selectedPath,
  targetFolderPath,
  searchText,
  isFiltered,
  onSelect,
  onSearch,
  onNewNote,
  onNewFolder,
  onDelete,
}: NoteTreePanelProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const [collapsedPaths, setCollapsedPaths] = useState<ReadonlySet<string>>(new Set())
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null)

  // Com filtro ou busca em vigor a árvore abre inteira: esconder um resultado atrás de pasta
  // fechada faria a busca mentir sobre o que encontrou.
  const visibleNodes = useMemo(
    () => (isFiltered ? [...nodes] : collapseNoteTree(nodes, collapsedPaths)),
    [nodes, isFiltered, collapsedPaths],
  )

  // Criar dentro de pasta fechada faria o arquivo novo nascer invisível, então o destino e o
  // caminho até ele abrem no mesmo gesto que pede a criação.
  function revealFolder(folderPath: string) {
    setCollapsedPaths((previous) => {
      const next = new Set(previous)
      const opened = [...listAncestorFolders(folderPath), folderPath].filter((folder) =>
        next.delete(folder),
      )

      return opened.length === 0 ? previous : next
    })
  }

  function handleNewNote(folderPath: string) {
    revealFolder(folderPath)
    onNewNote(folderPath)
  }

  function handleNewFolder(parentPath: string) {
    revealFolder(parentPath)
    onNewFolder(parentPath)
  }

  function toggleFolder(path: string) {
    setCollapsedPaths((previous) => {
      const next = new Set(previous)

      if (!next.delete(path)) {
        next.add(path)
      }

      return next
    })
  }

  function handleSelect(node: NoteTreeNode) {
    if (node.kind === 'folder') {
      toggleFolder(node.path)
    }

    onSelect(node)
  }

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, node: NoteTreeNode) => {
      if (event.key === 'Delete') {
        event.preventDefault()
        onDelete(node)

        return
      }

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
    },
    [onDelete],
  )

  // O menu da linha não pode subir para o da área vazia: o de cima chegaria depois e trocaria
  // o nó pelo `null` da raiz.
  function openMenuAt(event: MouseEvent, node: NoteTreeNode | null) {
    event.preventDefault()
    event.stopPropagation()
    setOpenMenu({ anchor: { x: event.clientX, y: event.clientY }, node })
  }

  function buildMenuActions(node: NoteTreeNode | null): NoteContextAction[] {
    const folderPath = resolveTargetFolder(node)

    const createActions: NoteContextAction[] = [
      { id: 'new-note', label: 'Nova nota aqui', onSelect: () => handleNewNote(folderPath) },
      { id: 'new-folder', label: 'Nova pasta aqui', onSelect: () => handleNewFolder(folderPath) },
    ]

    if (node === null) {
      return createActions
    }

    return [
      ...createActions,
      {
        id: 'delete',
        label: node.kind === 'folder' ? 'Excluir pasta' : 'Excluir nota',
        isDanger: true,
        onSelect: () => onDelete(node),
      },
    ]
  }

  return (
    <div className="flex flex-col overflow-hidden border-r border-border bg-sunken">
      <div className="grid flex-none gap-2 border-b border-border px-3 pb-2.5 pt-3">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-label uppercase text-text2" title={`${targetFolderPath}/`}>
            {targetFolderPath}/
          </span>
          <IconButton
            size="compact"
            label={`Nova nota em ${targetFolderPath}/`}
            className="ml-auto"
            onClick={() => handleNewNote(targetFolderPath)}
          >
            ＋
          </IconButton>
          <IconButton
            size="compact"
            label={`Nova pasta em ${targetFolderPath}/`}
            onClick={() => handleNewFolder(targetFolderPath)}
          >
            ⊞
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
        onContextMenu={(event) => openMenuAt(event, null)}
        className="grid flex-1 content-start gap-px overflow-y-auto p-2"
      >
        {visibleNodes.length === 0 ? (
          <EmptyState
            title={isFiltered ? 'Nada encontrado' : 'Nenhuma nota ainda'}
            description={
              isFiltered
                ? 'Nenhum arquivo desta pasta casa com o filtro e a busca de agora.'
                : 'As notas são arquivos .md na sua pasta de dados. Crie a primeira com ⌘N.'
            }
          />
        ) : (
          visibleNodes.map((node) => (
            <NoteTreeRow
              key={node.path}
              node={node}
              phaseColor={phaseColorOf(node.path)}
              isSelected={node.path === selectedPath}
              isCollapsed={collapsedPaths.has(node.path) && !isFiltered}
              onSelect={() => handleSelect(node)}
              onKeyDown={(event) => handleKeyDown(event, node)}
              onContextMenu={(event) => openMenuAt(event, node)}
            />
          ))
        )}
      </div>

      <div className="flex-none border-t border-border px-3 py-2 font-mono text-micro text-text3">
        {formatTreeTotals(nodes)}
      </div>

      {openMenu !== null && (
        <NoteTreeContextMenu
          anchor={openMenu.anchor}
          actions={buildMenuActions(openMenu.node)}
          onClose={() => setOpenMenu(null)}
        />
      )}
    </div>
  )
}
