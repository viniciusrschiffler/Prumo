import { useEffect, useMemo } from 'react'
import { useDatabaseStore } from '@/app/stores/useDatabaseStore'
import { useNotesStore } from '@/app/stores/useNotesStore'
import {
  buildNoteRows,
  findNoteRow,
  listLinkableProjects,
  listNoteProjectOptions,
  selectPathsForFilter,
} from '@/domain/notes/noteRow'
import { buildNoteTree, filterNoteTree, findFirstFile } from '@/domain/notes/noteTree'

export type NotesScreenStatus = 'loading' | 'ready' | 'error'

function combineStatus(statuses: readonly string[]): NotesScreenStatus {
  if (statuses.includes('error')) {
    return 'error'
  }

  return statuses.every((status) => status === 'ready') ? 'ready' : 'loading'
}

function intersect(
  first: ReadonlySet<string> | null,
  second: ReadonlySet<string> | null,
): ReadonlySet<string> | null {
  if (first === null) {
    return second
  }

  if (second === null) {
    return first
  }

  return new Set([...first].filter((path) => second.has(path)))
}

export function useNotesScreenData(projectFilterId: string) {
  const databaseStatus = useDatabaseStore((state) => state.status)
  const databaseError = useDatabaseStore((state) => state.errorMessage)
  const status = useNotesStore((state) => state.status)
  const errorMessage = useNotesStore((state) => state.errorMessage)
  const snapshot = useNotesStore((state) => state.snapshot)
  const matchedPaths = useNotesStore((state) => state.matchedPaths)
  const openPath = useNotesStore((state) => state.openPath)
  const load = useNotesStore((state) => state.load)
  const openNode = useNotesStore((state) => state.openNode)

  useEffect(() => {
    if (databaseStatus !== 'ready') {
      return
    }

    void load()
  }, [databaseStatus, load])

  const rows = useMemo(() => buildNoteRows(snapshot), [snapshot])
  const projectOptions = useMemo(() => listNoteProjectOptions(rows), [rows])
  const linkableProjects = useMemo(() => listLinkableProjects(snapshot), [snapshot])
  const phaseColorByPath = useMemo(
    () => new Map(rows.map((row) => [row.entry.path, row.phase?.color ?? null])),
    [rows],
  )
  const tree = useMemo(() => buildNoteTree(snapshot.entries), [snapshot.entries])

  const allowedPaths = useMemo(
    () => intersect(selectPathsForFilter(rows, projectFilterId), matchedPaths),
    [rows, projectFilterId, matchedPaths],
  )

  const visibleTree = useMemo(
    () => filterNoteTree(tree, allowedPaths),
    [tree, allowedPaths],
  )

  const selectedNode = useMemo(
    () => visibleTree.find((node) => node.path === openPath) ?? null,
    [visibleTree, openPath],
  )

  // Abrir o primeiro arquivo é o que a tela faz sozinha ao chegar, e também quando o filtro
  // esconde o que estava aberto: um editor apontando para um caminho fora da árvore mentiria.
  useEffect(() => {
    if (status !== 'ready' || selectedNode !== null) {
      return
    }

    const first = findFirstFile(visibleTree)

    void openNode(first)
  }, [status, selectedNode, visibleTree, openNode])

  return {
    status: combineStatus([databaseStatus, status]),
    errorMessage: errorMessage ?? databaseError,
    snapshot,
    rows,
    projectOptions,
    linkableProjects,
    phaseColorOf: (path: string) => phaseColorByPath.get(path) ?? null,
    visibleTree,
    selectedNode,
    selectedRow: findNoteRow(rows, openPath),
    retry: load,
  }
}
