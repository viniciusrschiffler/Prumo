import { useThemeStore, type ThemePreference } from '@/app/stores/useThemeStore'

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' },
]

export function ThemeSwitch() {
  const preference = useThemeStore((state) => state.preference)
  const setPreference = useThemeStore((state) => state.setPreference)

  return (
    <div className="flex gap-0.5 rounded-button border border-border bg-sunken p-0.5">
      {THEME_OPTIONS.map((option) => {
        const isSelected = option.value === preference

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => setPreference(option.value)}
            className={`rounded-badge px-2.5 py-1 text-support font-medium ${
              isSelected ? 'bg-panel text-text' : 'text-text2 hover:bg-neutral-soft hover:text-text'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
