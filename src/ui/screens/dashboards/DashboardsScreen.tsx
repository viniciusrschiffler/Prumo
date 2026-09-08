import { useEffect, useMemo, useState } from 'react'
import { todayIsoDate } from '@/app/clock'
import { useCommandPaletteStore } from '@/app/stores/useCommandPaletteStore'
import { useDatabaseStore } from '@/app/stores/useDatabaseStore'
import { useProjectsStore } from '@/app/stores/useProjectsStore'
import { useSettingsStore } from '@/app/stores/useSettingsStore'
import type { SidebarContextItem } from '@/app/stores/useSidebarContextStore'
import { useToastStore } from '@/app/stores/useToastStore'
import { buildDashboardCsv, buildDashboardCsvFileName } from '@/domain/dashboards/dashboardCsv'
import {
  DASHBOARD_PERIOD_KEYS,
  DEFAULT_DASHBOARD_PERIOD,
  type DashboardPeriodKey,
} from '@/domain/dashboards/dashboardPeriod'
import { toPublicMessage } from '@/domain/errors/PrumoError'
import { PROJECT_EVENT_LABELS } from '@/ui/labels/entityLabels'
import { useSidebarContext } from '@/ui/layout/useSidebarContext'
import { Alert } from '@/ui/primitives/Alert'
import { Button } from '@/ui/primitives/Button'
import { EmptyState } from '@/ui/primitives/EmptyState'
import { SegmentedControl } from '@/ui/primitives/SegmentedControl'
import { ScreenShell } from '../ScreenShell'
import { AllocationByProjectChart } from './AllocationByProjectChart'
import { BlockedDaysChart } from './BlockedDaysChart'
import { DASHBOARD_PERIOD_LABELS, formatSubhead } from './dashboardLabels'
import { DashboardKpiRow } from './DashboardKpiRow'
import { EventTypeChart } from './EventTypeChart'
import { PhaseDurationChart } from './PhaseDurationChart'
import { ProjectsByPhaseChart } from './ProjectsByPhaseChart'
import { useDashboardsScreenData } from './useDashboardsScreenData'
import { WorkloadChart } from './WorkloadChart'

const SUBHEAD_FALLBACK = 'indicadores derivados dos projetos'

const PERIOD_OPTIONS = DASHBOARD_PERIOD_KEYS.map((value) => ({
  value,
  label: DASHBOARD_PERIOD_LABELS[value],
}))

export function DashboardsScreen() {
  const databaseStatus = useDatabaseStore((state) => state.status)
  const status = useProjectsStore((state) => state.status)
  const errorMessage = useProjectsStore((state) => state.errorMessage)
  const snapshot = useProjectsStore((state) => state.snapshot)
  const load = useProjectsStore((state) => state.load)
  const weekStart = useSettingsStore((state) => state.settings.weekStart)
  const exportCsv = useSettingsStore((state) => state.exportCsv)
  const openCommandPalette = useCommandPaletteStore((state) => state.open)
  const notify = useToastStore((state) => state.notify)

  const [periodKey, setPeriodKey] = useState<DashboardPeriodKey>(DEFAULT_DASHBOARD_PERIOD)

  const today = todayIsoDate()

  useEffect(() => {
    if (databaseStatus !== 'ready') {
      return
    }

    void load()
  }, [databaseStatus, load])

  const summary = useDashboardsScreenData({ snapshot, today, weekStart, periodKey })

  const sidebarItems = useMemo<SidebarContextItem[]>(
    () =>
      snapshot.phases
        .filter((phase) => phase.active)
        .map((phase) => ({ id: phase.id, label: phase.name, color: phase.color })),
    [snapshot.phases],
  )

  useSidebarContext(sidebarItems, null)

  function downloadCsv() {
    const contents = buildDashboardCsv({
      summary,
      periodLabel: DASHBOARD_PERIOD_LABELS[periodKey],
      eventTypeLabels: PROJECT_EVENT_LABELS,
    })

    exportCsv(buildDashboardCsvFileName(summary), contents)
      .then((filePath) => notify(`Painéis exportados para ${filePath}.`))
      .catch((cause: unknown) => {
        console.error('Não foi possível exportar os painéis em CSV.', cause)
        notify(toPublicMessage(cause), 'danger')
      })
  }

  if (status === 'error') {
    return (
      <ScreenShell title="Painéis" subhead={SUBHEAD_FALLBACK}>
        <Alert
          level="danger"
          title="Não foi possível montar os painéis"
          action={
            <Button variant="danger" size="small" onClick={() => void load()}>
              Tentar de novo
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      </ScreenShell>
    )
  }

  if (status !== 'ready') {
    return (
      <ScreenShell title="Painéis" subhead={SUBHEAD_FALLBACK}>
        <p className="text-support text-text3">Carregando os painéis…</p>
      </ScreenShell>
    )
  }

  const periodControl = (
    <div className="ml-2.5 flex items-center gap-2">
      <span className="text-meta text-text3">Período</span>
      <SegmentedControl
        options={PERIOD_OPTIONS}
        value={periodKey}
        onChange={setPeriodKey}
        label="Período dos painéis"
      />
    </div>
  )

  const actions = (
    <>
      <Button onClick={downloadCsv}>Exportar CSV</Button>
      <Button keys="mod+k" onClick={openCommandPalette}>
        Comandos
      </Button>
    </>
  )

  if (summary.projectCount === 0) {
    return (
      <ScreenShell
        title="Painéis"
        subhead={formatSubhead(periodKey, summary.period, summary.projectCount)}
        lead={periodControl}
        actions={actions}
      >
        <EmptyState
          size="large"
          title="Nenhum projeto com atividade"
          description="Os painéis medem o que aconteceu na janela escolhida. Registre um evento, planeje uma tarefa ou aloque alguém para os gráficos terem o que somar."
        />
      </ScreenShell>
    )
  }

  return (
    <ScreenShell
      title="Painéis"
      subhead={formatSubhead(periodKey, summary.period, summary.projectCount)}
      lead={periodControl}
      actions={actions}
      contentClassName="flex-1 overflow-auto px-5 pb-7 pt-4"
    >
      <div className="grid content-start gap-3.5">
        <DashboardKpiRow kpis={summary.kpis} />

        <div className="grid grid-cols-[1.25fr_1fr] items-start gap-3.5">
          <AllocationByProjectChart
            rows={summary.allocationByProject}
            allocationCount={summary.allocationCount}
          />
          <ProjectsByPhaseChart counts={summary.projectsByPhase} />
        </div>

        <div className="grid grid-cols-3 items-start gap-3.5">
          <PhaseDurationChart rows={summary.phaseDurations} bottleneck={summary.bottleneck} />
          <BlockedDaysChart
            months={summary.blockedByMonth}
            projects={summary.blockedByProject}
            totalDays={summary.kpis.blockedDays}
          />
          <WorkloadChart rows={summary.workload} />
        </div>

        <EventTypeChart counts={summary.events} eventCount={summary.eventCount} />
      </div>
    </ScreenShell>
  )
}
