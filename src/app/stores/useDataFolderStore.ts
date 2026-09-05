import { create } from 'zustand'
import { resolveDataFolderPath } from '@/infra/config/resolveDataFolderPath'

// O rodapé da barra lateral e a tela de Configurações mostram o mesmo caminho, e ele muda
// quando o usuário escolhe outra pasta. Fica num store só para os dois nunca divergirem.
type DataFolderState = {
  path: string | null
  resolve: () => Promise<string | null>
  setPath: (path: string | null) => void
}

export const useDataFolderStore = create<DataFolderState>((set) => ({
  path: null,
  resolve: async () => {
    const path = await resolveDataFolderPath()

    set(() => ({ path }))

    return path
  },
  setPath: (path) => set(() => ({ path })),
}))
