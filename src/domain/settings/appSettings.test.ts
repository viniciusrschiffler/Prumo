import { describe, expect, it } from 'vitest'
import {
  APP_SETTING_DEFAULTS,
  APP_SETTING_KEYS,
  parseAppSettings,
  serializeAppSetting,
  type AppSettingField,
} from './appSettings'

describe('parseAppSettings', () => {
  it('Should fall back to the defaults on an empty table', () => {
    const parsed = parseAppSettings({})

    expect(parsed.settings).toEqual(APP_SETTING_DEFAULTS)
    expect(parsed.invalidKeys).toEqual([])
  })

  it('Should read every stored preference', () => {
    const parsed = parseAppSettings({
      [APP_SETTING_KEYS.themePreference]: 'dark',
      [APP_SETTING_KEYS.weekStart]: 'sunday',
      [APP_SETTING_KEYS.staleProjectAlertDays]: '21',
      [APP_SETTING_KEYS.showShortcutHints]: 'false',
      [APP_SETTING_KEYS.confirmBeforeBlocking]: 'false',
      [APP_SETTING_KEYS.notesOpenInPreview]: 'true',
    })

    expect(parsed.settings).toEqual({
      themePreference: 'dark',
      weekStart: 'sunday',
      staleProjectAlertDays: 21,
      showShortcutHints: false,
      confirmBeforeBlocking: false,
      notesOpenInPreview: true,
    })
  })

  it('Should report a corrupted value instead of swallowing it', () => {
    const parsed = parseAppSettings({ [APP_SETTING_KEYS.themePreference]: 'roxo' })

    expect(parsed.settings.themePreference).toBe(APP_SETTING_DEFAULTS.themePreference)
    expect(parsed.invalidKeys).toEqual([APP_SETTING_KEYS.themePreference])
  })

  it('Should refuse a threshold outside the accepted range', () => {
    const parsed = parseAppSettings({ [APP_SETTING_KEYS.staleProjectAlertDays]: '0' })

    expect(parsed.settings.staleProjectAlertDays).toBe(14)
    expect(parsed.invalidKeys).toEqual([APP_SETTING_KEYS.staleProjectAlertDays])
  })

  it('Should refuse a fractional threshold', () => {
    expect(
      parseAppSettings({ [APP_SETTING_KEYS.staleProjectAlertDays]: '7.5' }).invalidKeys,
    ).toEqual([APP_SETTING_KEYS.staleProjectAlertDays])
  })
})

describe('serializeAppSetting', () => {
  it('Should write the key and the text the parser reads back', () => {
    expect(serializeAppSetting('showShortcutHints', false)).toEqual({
      key: APP_SETTING_KEYS.showShortcutHints,
      value: 'false',
    })
    expect(serializeAppSetting('staleProjectAlertDays', 21)).toEqual({
      key: APP_SETTING_KEYS.staleProjectAlertDays,
      value: '21',
    })
  })

  it('Should round trip every field through the parser', () => {
    const fields = Object.keys(APP_SETTING_KEYS) as AppSettingField[]
    const written = Object.fromEntries(
      fields.map((field) => {
        const { key, value } = serializeAppSetting(field, APP_SETTING_DEFAULTS[field])

        return [key, value]
      }),
    )

    expect(parseAppSettings(written)).toEqual({
      settings: APP_SETTING_DEFAULTS,
      invalidKeys: [],
    })
  })
})
