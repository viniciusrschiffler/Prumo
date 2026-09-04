export type SettingRepository = {
  read(key: string): Promise<string | null>
  write(key: string, value: string): Promise<void>
  readAll(): Promise<Record<string, string>>
}
