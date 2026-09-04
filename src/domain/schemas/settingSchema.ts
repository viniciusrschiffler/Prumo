import { z } from 'zod'

export const SETTING_KEYS = {
  dataFolderPath: 'data_folder_path',
  themePreference: 'theme_preference',
  rowDensity: 'row_density',
  showShortcutHints: 'show_shortcut_hints',
} as const

export const settingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
})

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS]
export type Setting = z.infer<typeof settingSchema>
