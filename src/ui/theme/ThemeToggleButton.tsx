import { useSettingsStore } from '@/app/stores/useSettingsStore'
import { useToastStore } from '@/app/stores/useToastStore'
import { toPublicMessage } from '@/domain/errors/PrumoError'
import { IconButton } from '@/ui/primitives/IconButton'
import { useResolvedTheme, type ResolvedTheme } from './useResolvedTheme'

const GLYPH: Record<ResolvedTheme, string> = {
  light: '☀',
  dark: '☾',
}

const SWITCH_LABEL: Record<ResolvedTheme, string> = {
  light: 'Mudar para o tema claro',
  dark: 'Mudar para o tema escuro',
}

// A barra lateral alterna claro e escuro, e só. "Sistema" é uma terceira escolha que não se
// lê no botão — o glifo diria o tema em vigor e esconderia de onde ele veio —, então ela mora
// nas Configurações. O clique grava a preferência: sem isso a barra e a tela discordariam.
export function ThemeToggleButton() {
  const resolvedTheme = useResolvedTheme()
  const writeSetting = useSettingsStore((state) => state.writeSetting)
  const notify = useToastStore((state) => state.notify)
  const nextTheme: ResolvedTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

  function toggle() {
    writeSetting('themePreference', nextTheme).catch((cause: unknown) => {
      console.error('Não foi possível gravar o tema.', cause)
      notify(toPublicMessage(cause), 'danger')
    })
  }

  return (
    <IconButton
      size="compact"
      label={SWITCH_LABEL[nextTheme]}
      className="ml-auto"
      onClick={toggle}
    >
      {GLYPH[resolvedTheme]}
    </IconButton>
  )
}
