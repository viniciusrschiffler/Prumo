import { formatFileSize } from '@/domain/format/formatFileSize'
import { formatIsoDayMonth } from '@/domain/format/displayDate'
import { formatModifiedAt } from '@/domain/format/formatModifiedAt'
import type { NoteKind } from '@/domain/notes/noteDocument'
import { ALL_NOTES_FILTER, WITHOUT_PROJECT_FILTER } from '@/domain/notes/noteRow'
import type { NoteTreeNode } from '@/domain/notes/noteTree'
import type { IsoDateTime } from '@/domain/schemas/primitives'
import type { NoteSaveStatus } from '@/app/stores/useNotesStore'

export const NOTE_KIND_LABELS: Record<NoteKind, string> = {
  event: 'nota de evento',
  project: 'nota de projeto',
  personal: 'nota pessoal',
}

export const NOTE_FILTER_LABELS: Record<string, string> = {
  [ALL_NOTES_FILTER]: 'Todos',
  [WITHOUT_PROJECT_FILTER]: 'Sem projeto',
}

const SAVE_LABELS: Record<NoteSaveStatus, string> = {
  idle: 'sem alterações',
  dirty: 'não salvo',
  saving: 'gravando…',
  saved: 'salvo em disco',
  error: 'falha ao gravar',
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function formatTreeMeta(node: NoteTreeNode): string {
  return node.kind === 'folder' ? String(node.fileCount) : formatIsoDayMonth(dayOf(node.modifiedAt))
}

function dayOf(modifiedAt: IsoDateTime | null): string | null {
  return modifiedAt === null ? null : modifiedAt.slice(0, 10)
}

export function formatTreeTotals(nodes: readonly NoteTreeNode[]): string {
  const files = nodes.filter((node) => node.kind === 'file').length
  const folders = nodes.length - files

  return `${pluralize(files, 'arquivo .md', 'arquivos .md')} · ${pluralize(folders, 'pasta', 'pastas')}`
}

export function formatDocumentMeta(node: NoteTreeNode, now: Date): string {
  if (node.kind === 'folder') {
    return pluralize(node.fileCount, 'arquivo', 'arquivos')
  }

  const size = node.sizeBytes === null ? '' : ` · ${formatFileSize(node.sizeBytes)}`

  return `editado ${formatModifiedAt(node.modifiedAt, now)}${size}`
}

export function formatEditorStats(words: number, lines: number): string {
  return `${pluralize(words, 'palavra', 'palavras')} · ${pluralize(lines, 'linha', 'linhas')}`
}

export function formatSaveState(status: NoteSaveStatus, savedAt: IsoDateTime | null): string {
  if (status !== 'saved' || savedAt === null) {
    return SAVE_LABELS[status]
  }

  const moment = new Date(savedAt)
  const hours = String(moment.getHours()).padStart(2, '0')
  const minutes = String(moment.getMinutes()).padStart(2, '0')

  return `${SAVE_LABELS.saved} ${hours}:${minutes}`
}
