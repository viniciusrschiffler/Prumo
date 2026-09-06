import { formatIsoDate } from '@/domain/format/displayDate'
import { extractDocumentTitle, parseMarkdown } from '@/domain/notes/markdownBlocks'
import { noteBaseName } from '@/domain/notes/notePath'
import type { NoteRow } from '@/domain/notes/noteRow'
import type { NoteTreeNode } from '@/domain/notes/noteTree'
import { PROJECT_EVENT_LABELS } from '@/ui/labels/entityLabels'
import { classNames } from '@/ui/primitives/classNames'
import { PhaseStripe } from '@/ui/primitives/PhaseStripe'
import { MarkdownDocument } from './MarkdownDocument'
import { NOTE_KIND_LABELS, pluralize } from './noteLabels'

const CHIP_CLASSES = 'inline-flex items-center gap-[5px] rounded-badge px-[7px] py-px text-label'

type FolderPreviewProps = {
  node: NoteTreeNode
}

function FolderPreview({ node }: FolderPreviewProps) {
  return (
    <div className="grid h-full content-center justify-items-center gap-2 p-10 text-center">
      <div className="h-[34px] w-[34px] rounded-card border border-dashed border-border-strong bg-sunken" />
      <div className="text-section-title">{node.name}/</div>
      <div className="max-w-[320px] text-pretty text-support text-text2">
        {pluralize(node.fileCount, 'arquivo', 'arquivos')} nesta pasta. Selecione um arquivo{' '}
        <span className="font-mono text-meta">.md</span> na árvore para editar e visualizar.
      </div>
    </div>
  )
}

type NotePreviewPaneProps = {
  node: NoteTreeNode
  row: NoteRow | null
  content: string
  className?: string
}

export function NotePreviewPane({ node, row, content, className }: NotePreviewPaneProps) {
  if (node.kind === 'folder') {
    return (
      <div className={classNames('overflow-auto bg-panel', className)}>
        <FolderPreview node={node} />
      </div>
    )
  }

  const { title, body } = extractDocumentTitle(parseMarkdown(content), noteBaseName(node.path))
  const kindLabel =
    row?.event === undefined || row.event === null
      ? NOTE_KIND_LABELS[row?.kind ?? 'personal']
      : PROJECT_EVENT_LABELS[row.event.type].toLowerCase()

  return (
    <div className={classNames('overflow-auto bg-panel', className)}>
      <div className="grid max-w-[720px] gap-3.5 px-7 pb-12 pt-[22px]">
        <h2 className="text-article-title">{title}</h2>

        <div className="flex flex-wrap gap-1.5">
          <span className={classNames(CHIP_CLASSES, 'bg-neutral-soft font-semibold text-text2')}>
            {kindLabel}
          </span>
          <span className={classNames(CHIP_CLASSES, 'border border-border font-normal tracking-normal text-text2')}>
            {formatIsoDate(node.modifiedAt === null ? null : node.modifiedAt.slice(0, 10))}
          </span>
          <span className={classNames(CHIP_CLASSES, 'border border-border font-normal tracking-normal text-text2')}>
            {row?.phase?.color !== undefined && <PhaseStripe color={row.phase.color} size="small" />}
            {row?.project?.name ?? 'sem projeto'}
          </span>
        </div>

        <MarkdownDocument blocks={body} />
      </div>
    </div>
  )
}
