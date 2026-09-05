import type { Setting } from '@/domain/schemas/settingSchema'

export type SettingRepository = {
  read(key: string): Promise<string | null>
  write(key: string, value: string): Promise<void>
  writeMany(settings: readonly Setting[]): Promise<void>
  readAll(): Promise<Record<string, string>>
}
