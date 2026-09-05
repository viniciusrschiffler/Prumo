import { useState } from 'react'
import { useSettingsStore } from '@/app/stores/useSettingsStore'
import { useToastStore } from '@/app/stores/useToastStore'
import { toPublicMessage } from '@/domain/errors/PrumoError'
import {
  THEME_PREFERENCES,
  WEEK_STARTS,
  type AppSettingField,
  type AppSettings,
  type ThemePreference,
  type WeekStart,
} from '@/domain/settings/appSettings'
import { Checkbox } from '@/ui/primitives/Checkbox'
import { SectionCard } from '@/ui/primitives/SectionCard'
import { SegmentedControl } from '@/ui/primitives/SegmentedControl'
import { Input } from '@/ui/primitives/Input'
import { Select } from '@/ui/primitives/Select'

const MIN_STALE_DAYS = 1
const MAX_STALE_DAYS = 365

const THEME_LABELS: Record<ThemePreference, string> = {
  light: 'Claro',
  dark: 'Escuro',
  system: 'Sistema',
}

const WEEK_START_LABELS: Record<WeekStart, string> = {
  monday: 'Segunda-feira',
  sunday: 'Domingo',
}

const THEME_OPTIONS = THEME_PREFERENCES.map((value) => ({ value, label: THEME_LABELS[value] }))

type BooleanSettingField = {
  [TField in AppSettingField]: AppSettings[TField] extends boolean ? TField : never
}[AppSettingField]

const FLAGS: { field: BooleanSettingField; label: string; description: string }[] = [
  {
    field: 'showShortcutHints',
    label: 'Mostrar atalhos nos tooltips',
    description: 'Exibe a tecla ao lado do nome da ação.',
  },
  {
    field: 'confirmBeforeBlocking',
    label: 'Confirmar antes de bloquear projeto',
    description: 'Pede motivo e data de retomada — encerra as alocações.',
  },
  {
    field: 'notesOpenInPreview',
    label: 'Abrir notas já em preview',
    description: 'Por padrão a nota abre no modo dividido.',
  },
]

type StaleDaysFieldProps = {
  value: number
  onCommit: (days: number) => void
}

function StaleDaysField({ value, onCommit }: StaleDaysFieldProps) {
  const [text, setText] = useState(String(value))
  const parsed = Number(text)
  const isValid =
    Number.isInteger(parsed) && parsed >= MIN_STALE_DAYS && parsed <= MAX_STALE_DAYS

  function commit() {
    if (!isValid || parsed === value) {
      setText(String(value))

      return
    }

    onCommit(parsed)
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <Input
        id="stale-days"
        numeric
        invalid={!isValid}
        className="w-14 text-right"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur()
          }

          if (event.key === 'Escape') {
            setText(String(value))
          }
        }}
      />
      <span className="text-support text-text3">dias</span>
    </span>
  )
}

export function PreferencesSection() {
  const settings = useSettingsStore((state) => state.settings)
  const writeSetting = useSettingsStore((state) => state.writeSetting)
  const notify = useToastStore((state) => state.notify)

  function save<TField extends AppSettingField>(field: TField, value: AppSettings[TField]) {
    writeSetting(field, value).catch((cause: unknown) => {
      console.error('Não foi possível gravar a preferência.', cause)
      notify(toPublicMessage(cause), 'danger')
    })
  }

  return (
    <SectionCard id="preferencias" title="Preferências">
      <div className="grid grid-cols-2 gap-3.5 p-3.5">
        <div className="grid content-start gap-2.5">
          <div className="grid gap-[5px]">
            <span className="text-meta text-text2">Tema</span>
            <SegmentedControl
              options={THEME_OPTIONS}
              value={settings.themePreference}
              onChange={(value) => save('themePreference', value)}
              label="Tema"
              size="wide"
            />
          </div>

          <label className="grid gap-1">
            <span className="text-meta text-text2">Início da semana</span>
            <Select
              className="w-45"
              value={settings.weekStart}
              onChange={(event) => save('weekStart', event.target.value as WeekStart)}
            >
              {WEEK_STARTS.map((value) => (
                <option key={value} value={value}>
                  {WEEK_START_LABELS[value]}
                </option>
              ))}
            </Select>
          </label>

          <div className="grid gap-1">
            <label htmlFor="stale-days" className="text-meta text-text2">
              Alertar projeto sem atualização após
            </label>
            <StaleDaysField
              key={settings.staleProjectAlertDays}
              value={settings.staleProjectAlertDays}
              onCommit={(days) => save('staleProjectAlertDays', days)}
            />
          </div>
        </div>

        <div className="grid content-start gap-[9px]">
          {FLAGS.map((flag) => (
            <Checkbox
              key={flag.field}
              description={flag.description}
              checked={settings[flag.field]}
              onChange={(event) => save(flag.field, event.target.checked)}
            >
              {flag.label}
            </Checkbox>
          ))}
        </div>
      </div>
    </SectionCard>
  )
}
