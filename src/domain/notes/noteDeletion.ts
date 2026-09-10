import { isMarkdownPath } from './notePath'
import type { NoteEntry, NoteTarget } from './noteTree'

export type NoteDeletionPlan = {
  path: string
  name: string
  kind: NoteTarget['kind']
  filePaths: readonly string[]
  folderCount: number
}

function isInside(path: string, folder: string): boolean {
  return path.startsWith(`${folder}/`)
}

// Apagar pasta leva junto o que está dentro dela, e o índice do banco precisa saber quais
// arquivos saíram: linha de nota apontando para arquivo que não existe mais é exatamente o que
// o "Verificar arquivos" das Configurações acusa depois.
export function planNoteDeletion(
  entries: readonly NoteEntry[],
  target: NoteTarget,
  name: string,
): NoteDeletionPlan {
  if (target.kind === 'file') {
    return {
      path: target.path,
      name,
      kind: 'file',
      filePaths: isMarkdownPath(target.path) ? [target.path] : [],
      folderCount: 0,
    }
  }

  const inside = entries.filter((entry) => isInside(entry.path, target.path))

  return {
    path: target.path,
    name,
    kind: 'folder',
    filePaths: inside.filter((entry) => entry.kind === 'file').map((entry) => entry.path),
    folderCount: inside.filter((entry) => entry.kind === 'folder').length,
  }
}

export function isPathRemovedBy(plan: NoteDeletionPlan, path: string): boolean {
  return path === plan.path || isInside(path, plan.path)
}
