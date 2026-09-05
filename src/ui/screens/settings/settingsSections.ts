export const SETTINGS_SECTIONS = [
  { id: 'pasta-de-dados', label: 'Pasta de dados' },
  { id: 'pessoas', label: 'Pessoas' },
  { id: 'fases', label: 'Fases' },
  { id: 'preferencias', label: 'Preferências' },
] as const

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]['id']

export function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
