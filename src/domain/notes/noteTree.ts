import type { IsoDateTime } from '@/domain/schemas/primitives'
import { noteDepth, noteFileName, noteFolderOf, noteSegments, NOTES_ROOT } from './notePath'

export type NoteEntryKind = 'folder' | 'file'

export type NoteEntry = {
  path: string
  kind: NoteEntryKind
  sizeBytes: number | null
  modifiedAt: IsoDateTime | null
}

export type NoteTreeNode = NoteEntry & {
  name: string
  depth: number
  fileCount: number
}

function compareSiblings(first: NoteEntry, second: NoteEntry): number {
  if (first.kind !== second.kind) {
    return first.kind === 'folder' ? -1 : 1
  }

  return noteFileName(first.path).localeCompare(noteFileName(second.path), 'pt-BR')
}

function isInside(path: string, folder: string): boolean {
  return path.startsWith(`${folder}/`)
}

export function countFilesIn(entries: readonly NoteEntry[], folder: string): number {
  return entries.filter((entry) => entry.kind === 'file' && isInside(entry.path, folder)).length
}

function toNode(entry: NoteEntry, entries: readonly NoteEntry[]): NoteTreeNode {
  return {
    ...entry,
    name: noteFileName(entry.path),
    depth: noteDepth(entry.path),
    fileCount: entry.kind === 'folder' ? countFilesIn(entries, entry.path) : 0,
  }
}

// A árvore sai em profundidade: cada pasta é seguida do que mora dentro dela, com pasta antes
// de arquivo em cada nível. É a ordem que o desenho imprime e a única que o recuo explica.
export function buildNoteTree(entries: readonly NoteEntry[]): NoteTreeNode[] {
  const inside = entries.filter((entry) => noteSegments(entry.path)[0] === NOTES_ROOT)

  function collect(folder: string): NoteTreeNode[] {
    return inside
      .filter((entry) => noteFolderOf(entry.path) === folder)
      .toSorted(compareSiblings)
      .flatMap((entry) =>
        entry.kind === 'folder'
          ? [toNode(entry, inside), ...collect(entry.path)]
          : [toNode(entry, inside)],
      )
  }

  return collect(NOTES_ROOT)
}

// A pasta sobrevive ao filtro quando algum arquivo dentro dela sobreviveu: escondê-la esconderia
// o caminho até um resultado que existe. Sem filtro, a árvore passa inteira, pastas vazias
// incluídas — elas são do usuário, não sobra de busca.
export function filterNoteTree(
  tree: readonly NoteTreeNode[],
  allowedPaths: ReadonlySet<string> | null,
): NoteTreeNode[] {
  if (allowedPaths === null) {
    return [...tree]
  }

  const keptFiles = tree.filter(
    (node) => node.kind === 'file' && allowedPaths.has(node.path),
  )

  return tree
    .filter(
      (node) =>
        (node.kind === 'file' && allowedPaths.has(node.path)) ||
        (node.kind === 'folder' &&
          keptFiles.some((file) => isInside(file.path, node.path))),
    )
    .map((node) =>
      node.kind === 'folder'
        ? { ...node, fileCount: keptFiles.filter((file) => isInside(file.path, node.path)).length }
        : node,
    )
}

export function findFirstFile(tree: readonly NoteTreeNode[]): NoteTreeNode | null {
  return tree.find((node) => node.kind === 'file') ?? null
}
