import { useEffect, useMemo, useState } from 'react'
import { useDatabaseStore } from '@/app/stores/useDatabaseStore'
import { useSettingsStore } from '@/app/stores/useSettingsStore'
import { countActivePeople, sumTeamWeeklyCapacity } from '@/domain/derived/sumTeamWeeklyCapacity'
import { formatModifiedAt } from '@/domain/format/formatModifiedAt'
import type { SidebarContextItem } from '@/app/stores/useSidebarContextStore'
import { Alert } from '@/ui/primitives/Alert'
import { Button } from '@/ui/primitives/Button'
import { useSidebarContext } from '@/ui/layout/useSidebarContext'
import { DataFolderSection } from './settings/DataFolderSection'
import { DataIntegritySection } from './settings/DataIntegritySection'
import { PeopleSection } from './settings/PeopleSection'
import { PhasesSection } from './settings/PhasesSection'
import { PreferencesSection } from './settings/PreferencesSection'
import { SETTINGS_SECTIONS, scrollToSection, type SettingsSectionId } from './settings/settingsSections'
import { ScreenShell } from './ScreenShell'

const DATABASE_FILE_NAME = 'prumo.db'

function SaveStamp() {
  const folderEntries = useSettingsStore((state) => state.folderEntries)
  const databaseEntry = folderEntries.find((entry) => entry.name === DATABASE_FILE_NAME)

  if (databaseEntry === undefined) {
    return <span className="font-mono text-meta text-text3">sem gravação registrada</span>
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-meta text-ok">
      <span className="h-1.5 w-1.5 rounded-full bg-ok" />
      gravado {formatModifiedAt(databaseEntry.modifiedAt, new Date())}
    </span>
  )
}

export function SettingsScreen() {
  const databaseStatus = useDatabaseStore((state) => state.status)
  const status = useSettingsStore((state) => state.status)
  const errorMessage = useSettingsStore((state) => state.errorMessage)
  const people = useSettingsStore((state) => state.people)
  const phases = useSettingsStore((state) => state.phases)
  const invalidSettingKeys = useSettingsStore((state) => state.invalidSettingKeys)
  const load = useSettingsStore((state) => state.load)
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('pasta-de-dados')

  useEffect(() => {
    if (databaseStatus !== 'ready') {
      return
    }

    void load()
  }, [databaseStatus, load])

  const sidebarItems = useMemo<SidebarContextItem[]>(() => {
    const metaById: Partial<Record<SettingsSectionId, string>> = {
      pessoas: String(people.length),
      fases: String(phases.length),
    }

    return SETTINGS_SECTIONS.map((section) => ({
      id: section.id,
      label: section.label,
      meta: metaById[section.id] ?? '',
    }))
  }, [people.length, phases.length])

  useSidebarContext(sidebarItems, activeSection, (id) => {
    setActiveSection(id as SettingsSectionId)
    scrollToSection(id)
  })

  const activePeople = countActivePeople(people)
  const teamCapacity = sumTeamWeeklyCapacity(people)
  const subhead =
    status === 'ready'
      ? `${activePeople} pessoas ativas · ${phases.length} fases · ${teamCapacity}h/semana de capacidade`
      : 'pasta de dados, pessoas e fases'

  return (
    <ScreenShell
      title="Configurações"
      subhead={subhead}
      actions={status === 'ready' ? <SaveStamp /> : undefined}
      contentClassName="px-5 pb-8 pt-4"
    >
      <div className="grid max-w-260 auto-rows-max content-start gap-4">
        {status === 'error' && (
          <Alert
            level="danger"
            title="Não foi possível abrir as configurações"
            action={
              <Button variant="danger" size="small" onClick={() => void load()}>
                Tentar de novo
              </Button>
            }
          >
            {errorMessage}
          </Alert>
        )}

        {invalidSettingKeys.length > 0 && (
          <Alert level="warn" title="Preferências em formato inesperado">
            {invalidSettingKeys.join(', ')} — o Prumo voltou ao padrão nessas.
          </Alert>
        )}

        {status === 'loading' || status === 'idle' ? (
          <p className="text-support text-text3">Carregando as configurações…</p>
        ) : (
          <>
            <DataFolderSection />
            <PeopleSection />
            <PhasesSection />
            <PreferencesSection />
            <DataIntegritySection />
          </>
        )}
      </div>
    </ScreenShell>
  )
}
