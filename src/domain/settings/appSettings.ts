import { z } from 'zod'

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const
export const WEEK_STARTS = ['monday', 'sunday'] as const

export const themePreferenceSchema = z.enum(THEME_PREFERENCES)
export const weekStartSchema = z.enum(WEEK_STARTS)

export type ThemePreference = z.infer<typeof themePreferenceSchema>
export type WeekStart = z.infer<typeof weekStartSchema>

const booleanTextSchema = z.enum(['true', 'false']).transform((text) => text === 'true')
const staleProjectAlertDaysSchema = z.coerce.number().int().min(1).max(365)

export const APP_SETTING_KEYS = {
  themePreference: 'theme_preference',
  weekStart: 'week_start',
  staleProjectAlertDays: 'stale_project_alert_days',
  showShortcutHints: 'show_shortcut_hints',
  confirmBeforeBlocking: 'confirm_before_blocking',
  notesOpenInPreview: 'notes_open_in_preview',
} as const

export type AppSettingField = keyof typeof APP_SETTING_KEYS

export type AppSettings = {
  themePreference: ThemePreference
  weekStart: WeekStart
  staleProjectAlertDays: number
  showShortcutHints: boolean
  confirmBeforeBlocking: boolean
  notesOpenInPreview: boolean
}

export const APP_SETTING_DEFAULTS: AppSettings = {
  themePreference: 'system',
  weekStart: 'monday',
  staleProjectAlertDays: 14,
  showShortcutHints: true,
  confirmBeforeBlocking: true,
  notesOpenInPreview: false,
}

export type ParsedAppSettings = {
  settings: AppSettings
  invalidKeys: string[]
}

// Uma preferência corrompida não pode impedir a tela de abrir, mas some-la em silêncio
// esconderia o problema. Cai no padrão e devolve a chave para a tela avisar.
function readField<TValue>(
  raw: Readonly<Record<string, string>>,
  key: string,
  schema: z.ZodType<TValue>,
  fallback: TValue,
  invalidKeys: string[],
): TValue {
  const stored = raw[key]

  if (stored === undefined) {
    return fallback
  }

  const result = schema.safeParse(stored)

  if (!result.success) {
    invalidKeys.push(key)

    return fallback
  }

  return result.data
}

export function parseAppSettings(raw: Readonly<Record<string, string>>): ParsedAppSettings {
  const invalidKeys: string[] = []

  const settings: AppSettings = {
    themePreference: readField(
      raw,
      APP_SETTING_KEYS.themePreference,
      themePreferenceSchema,
      APP_SETTING_DEFAULTS.themePreference,
      invalidKeys,
    ),
    weekStart: readField(
      raw,
      APP_SETTING_KEYS.weekStart,
      weekStartSchema,
      APP_SETTING_DEFAULTS.weekStart,
      invalidKeys,
    ),
    staleProjectAlertDays: readField(
      raw,
      APP_SETTING_KEYS.staleProjectAlertDays,
      staleProjectAlertDaysSchema,
      APP_SETTING_DEFAULTS.staleProjectAlertDays,
      invalidKeys,
    ),
    showShortcutHints: readField(
      raw,
      APP_SETTING_KEYS.showShortcutHints,
      booleanTextSchema,
      APP_SETTING_DEFAULTS.showShortcutHints,
      invalidKeys,
    ),
    confirmBeforeBlocking: readField(
      raw,
      APP_SETTING_KEYS.confirmBeforeBlocking,
      booleanTextSchema,
      APP_SETTING_DEFAULTS.confirmBeforeBlocking,
      invalidKeys,
    ),
    notesOpenInPreview: readField(
      raw,
      APP_SETTING_KEYS.notesOpenInPreview,
      booleanTextSchema,
      APP_SETTING_DEFAULTS.notesOpenInPreview,
      invalidKeys,
    ),
  }

  return { settings, invalidKeys }
}

export function serializeAppSetting<TField extends AppSettingField>(
  field: TField,
  value: AppSettings[TField],
): { key: string; value: string } {
  return { key: APP_SETTING_KEYS[field], value: String(value) }
}
