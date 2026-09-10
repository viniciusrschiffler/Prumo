import type { NoteRow } from '@/domain/notes/noteRow'
import type { NoteTreeNode } from '@/domain/notes/noteTree'
import { Button } from '@/ui/primitives/Button'
import { IconButton } from '@/ui/primitives/IconButton'
import { PhaseStripe } from '@/ui/primitives/PhaseStripe'
import { SegmentedControl } from '@/ui/primitives/SegmentedControl'
import { formatDocumentMeta } from './noteLabels'
import { NOTE_VIEW_OPTIONS, type NoteViewMode } from './noteViewMode'

type NoteDocumentHeaderProps = {
  node: NoteTreeNode
  row: NoteRow | null
  mode: NoteViewMode
  now: Date
  onModeChange: (mode: NoteViewMode) => void
  onLink: () => void
  onNewNote: () => void
  onDelete: () => void
}

export function NoteDocumentHeader({
  node,
  row,
  mode,
  now,
  onModeChange,
  onLink,
  onNewNote,
  onDelete,
}: NoteDocumentHeaderProps) {
  const isFolder = node.kind === 'folder'

  return (
    <header className="grid flex-none gap-[9px] border-b border-border bg-panel px-[18px] py-3">
      <div className="flex items-center gap-3">
        <div className="grid gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-doc-title">{isFolder ? `${node.name}/` : node.name}</h1>
            {!isFolder && (
              <span className="inline-flex items-center gap-[5px] rounded-badge bg-neutral-soft px-1.5 py-px text-micro text-text2">
                {row?.phase?.color !== undefined && (
                  <PhaseStripe color={row.phase.color} size="small" />
                )}
                {row?.project?.name ?? 'sem projeto'}
              </span>
            )}
          </div>
          <span className="font-mono text-micro text-text3">
            {isFolder ? `${node.path}/` : node.path} · {formatDocumentMeta(node, now)}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <SegmentedControl
            options={NOTE_VIEW_OPTIONS}
            value={mode}
            onChange={onModeChange}
            label="Modo de exibição"
          />
          <Button disabled={isFolder} onClick={onLink}>
            Vincular projeto
            <span className="font-mono text-micro text-text3">@</span>
          </Button>
          <Button variant="primary" keys="mod+n" onClick={onNewNote}>
            Nova nota
          </Button>
          <IconButton
            label={isFolder ? `Excluir a pasta ${node.name}` : `Excluir a nota ${node.name}`}
            className="hover:border-danger hover:text-danger"
            onClick={onDelete}
          >
            ✕
          </IconButton>
        </div>
      </div>
    </header>
  )
}
