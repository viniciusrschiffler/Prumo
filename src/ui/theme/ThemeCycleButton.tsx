import { useThemeStore, type ThemePreference } from '@/app/stores/useThemeStore'

const NEXT_PREFERENCE: Record<ThemePreference, ThemePreference> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}

const PREFERENCE_GLYPH: Record<ThemePreference, string> = {
  light: '☀',
  dark: '☾',
  system: '◐',
}

const PREFERENCE_LABEL: Record<ThemePreference, string> = {
  light: 'Tema claro',
  dark: 'Tema escuro',
  system: 'Tema do sistema',
}

export function ThemeCycleButton() {
  const preference = useThemeStore((state) => state.preference)
  const setPreference = useThemeStore((state) => state.setPreference)

  return (
    <button
      type="button"
      title={PREFERENCE_LABEL[preference]}
      aria-label={PREFERENCE_LABEL[preference]}
      onClick={() => setPreference(NEXT_PREFERENCE[preference])}
      className="ml-auto inline-flex h-[22px] w-[22px] items-center justify-center rounded-[5px] border border-border bg-panel font-mono text-micro text-text2 hover:border-border-strong hover:text-text"
    >
      {PREFERENCE_GLYPH[preference]}
    </button>
  )
}
