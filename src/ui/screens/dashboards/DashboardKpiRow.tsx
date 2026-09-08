import type { DashboardKpis } from '@/domain/dashboards/dashboardKpis'
import { StatCard, type StatCardTone } from '@/ui/primitives/StatCard'
import { formatDeviationDays, formatHours, formatPercentage } from './dashboardLabels'

type DashboardKpiRowProps = {
  kpis: DashboardKpis
}

// O mockup pinta o atraso médio e os dias bloqueado de vermelho sem condição. Um time
// adiantado, ou uma janela sem bloqueio nenhum, não tem o que alarmar.
function deviationTone(days: number | null): StatCardTone {
  if (days === null || days === 0) {
    return 'default'
  }

  return days > 0 ? 'danger' : 'ok'
}

function blockedTone(days: number): StatCardTone {
  return days > 0 ? 'danger' : 'default'
}

export function DashboardKpiRow({ kpis }: DashboardKpiRowProps) {
  return (
    <div className="grid grid-cols-5 gap-2.5">
      <StatCard size="large" label="Projetos entregues" hint="no período">
        {kpis.deliveredProjectCount}
      </StatCard>
      <StatCard
        size="large"
        label="Atraso médio"
        tone={deviationTone(kpis.averageDeviationInDays)}
        hint="vs baseline atual"
      >
        {formatDeviationDays(kpis.averageDeviationInDays)}
      </StatCard>
      <StatCard size="large" label="Esforço planejado" hint="soma das tarefas">
        {formatHours(kpis.plannedEffortHours)}
      </StatCard>
      <StatCard size="large" label="Uso de capacidade" hint="média do time">
        {formatPercentage(kpis.capacityUsagePercentage)}
      </StatCard>
      <StatCard
        size="large"
        label="Dias bloqueado"
        tone={blockedTone(kpis.blockedDays)}
        hint="soma dos projetos"
      >
        {kpis.blockedDays}
      </StatCard>
    </div>
  )
}
