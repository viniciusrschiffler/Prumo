import { z } from 'zod'

// As preferências do usuário e suas chaves ficam em domain/settings/appSettings.ts.
// Aqui só entram as chaves operacionais, escritas pelo app e não pelo usuário.
// O caminho da pasta de dados não cabe aqui: ele localiza o banco onde esta tabela mora.
export const SETTING_KEYS = {
  lastIntegrityCheckAt: 'last_integrity_check_at',
  lastIntegrityCheckResult: 'last_integrity_check_result',
} as const

export const settingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
})

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS]
export type Setting = z.infer<typeof settingSchema>
