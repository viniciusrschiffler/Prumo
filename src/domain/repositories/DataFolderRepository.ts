import type { IsoDateTime } from '@/domain/schemas/primitives'

export type DataFolderEntryKind = 'file' | 'directory'

export type DataFolderEntry = {
  name: string
  kind: DataFolderEntryKind
  sizeBytes: number | null
  childCount: number | null
  modifiedAt: IsoDateTime | null
}

export type DataFolderRepository = {
  listEntries(folderPath: string): Promise<DataFolderEntry[]>
  choose(currentPath: string | null): Promise<string | null>
  reveal(folderPath: string): Promise<void>
}
