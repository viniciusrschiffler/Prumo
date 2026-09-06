import { create } from 'zustand'
import { todayIsoDate } from '@/app/clock'
import { useDataFolderStore } from '@/app/stores/useDataFolderStore'
import type { NavigationCounts } from '@/domain/repositories/NavigationCountsRepository'
import { countTodayItems } from '@/domain/today/todayAgenda'
import { getSqlGateway } from '@/infra/database/DatabaseConnection'
import { SqliteNavigationCountsRepository } from '@/infra/repositories/SqliteNavigationCountsRepository'
import { SqliteProjectRepository } from '@/infra/repositories/SqliteProjectRepository'
import { SqliteTaskRepository } from '@/infra/repositories/SqliteTaskRepository'
import { SqliteTodoRepository } from '@/infra/repositories/SqliteTodoRepository'
import { TauriNoteFilesRepository } from '@/infra/repositories/TauriNoteFilesRepository'

export type SidebarCounts = NavigationCounts & {
  today: number
  notes: number
}

type NavigationCountsState = {
  counts: SidebarCounts | null
  refresh: () => Promise<void>
}

// A nota é arquivo, não linha: contá-la pela tabela `note` mostraria um número diferente do
// que a árvore imprime, porque um `.md` largado na pasta ainda não tem linha. Pasta ilegível
// não derruba os outros contadores — ela só não soma.
async function countNoteFiles(): Promise<number> {
  const dataFolderPath = useDataFolderStore.getState().path

  if (dataFolderPath === null) {
    return 0
  }

  try {
    const entries = await new TauriNoteFilesRepository(dataFolderPath).listEntries()

    return entries.filter((entry) => entry.kind === 'file').length
  } catch (cause) {
    console.error('Não foi possível contar as notas da pasta.', cause)

    return 0
  }
}

// Projeto e todo se contam com um SELECT count(*); o de Hoje é derivado, então ele sai das
// mesmas funções que a tela usa, sobre as linhas cruas.
async function readCounts(): Promise<SidebarCounts> {
  const gateway = getSqlGateway()

  const [counts, todos, tasks, projects, notes] = await Promise.all([
    new SqliteNavigationCountsRepository(gateway).read(),
    new SqliteTodoRepository(gateway).listAll(),
    new SqliteTaskRepository(gateway).listAll(),
    new SqliteProjectRepository(gateway).listAll(),
    countNoteFiles(),
  ])

  return {
    ...counts,
    today: countTodayItems({ todos, tasks, projects, today: todayIsoDate() }),
    notes,
  }
}

export const useNavigationCountsStore = create<NavigationCountsState>((set) => ({
  counts: null,
  refresh: async () => {
    try {
      const counts = await readCounts()

      set(() => ({ counts }))
    } catch (cause) {
      console.error('Não foi possível ler os contadores da navegação.', cause)
    }
  },
}))
