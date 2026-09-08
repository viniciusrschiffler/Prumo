import type { ProjectEventType } from '@/domain/schemas/projectEventSchema'
import type { DashboardSummary } from './dashboardSummary'

const HEADER = ['secao', 'item', 'valor', 'unidade'] as const
const DECIMAL_PLACES = 2

export type DashboardCsvInput = {
  summary: DashboardSummary
  periodLabel: string
  eventTypeLabels: Record<ProjectEventType, string>
}

type CsvRow = readonly [string, string, string, string]

// O separador é a vírgula e o decimal é o ponto, como o RFC 4180 os define. Trocar por ponto e
// vírgula agradaria a uma configuração de planilha e quebraria todas as outras.
function escapeField(value: string): string {
  if (!/[",\r\n]/.test(value)) {
    return value
  }

  return `"${value.replaceAll('"', '""')}"`
}

function formatNumber(value: number): string {
  return String(Number(value.toFixed(DECIMAL_PLACES)))
}

function buildPeriodRows(input: DashboardCsvInput): CsvRow[] {
  const { summary } = input

  return [
    ['período', 'janela', input.periodLabel, ''],
    ['período', 'início', summary.period.start, 'data'],
    ['período', 'fim', summary.period.end, 'data'],
    ['período', 'projetos com atividade', String(summary.projectCount), 'projetos'],
  ]
}

function buildKpiRows({ kpis }: DashboardSummary): CsvRow[] {
  return [
    ['indicador', 'projetos entregues', String(kpis.deliveredProjectCount), 'projetos'],
    [
      'indicador',
      'atraso médio',
      kpis.averageDeviationInDays === null ? '' : String(kpis.averageDeviationInDays),
      'dias',
    ],
    ['indicador', 'esforço planejado', formatNumber(kpis.plannedEffortHours), 'horas'],
    ['indicador', 'uso de capacidade', formatNumber(kpis.capacityUsagePercentage), '%'],
    ['indicador', 'dias bloqueado', String(kpis.blockedDays), 'dias'],
  ]
}

function buildChartRows(
  summary: DashboardSummary,
  eventTypeLabels: Record<ProjectEventType, string>,
): CsvRow[] {
  const allocation = summary.allocationByProject.flatMap<CsvRow>((row) => [
    ['pessoas alocadas por projeto', row.name, formatNumber(row.peakPercentage), '%'],
    ['pessoas alocadas por projeto', row.name, String(row.personCount), 'pessoas'],
    ['pessoas alocadas por projeto', row.name, String(row.allocationCount), 'alocações'],
  ])

  const byPhase = summary.projectsByPhase.map<CsvRow>((entry) => [
    'projetos por fase',
    entry.phase.name,
    String(entry.projectCount),
    'projetos',
  ])

  const durations = summary.phaseDurations.map<CsvRow>((row) => [
    'tempo médio em cada fase',
    row.phase.name,
    row.averageDays === null ? '' : formatNumber(row.averageDays),
    'dias',
  ])

  const blockedMonths = summary.blockedByMonth.map<CsvRow>((month) => [
    'dias bloqueado por mês',
    month.monthStart.slice(0, 7),
    String(month.blockedDays),
    'dias',
  ])

  const blockedProjects = summary.blockedByProject.map<CsvRow>((row) => [
    'dias bloqueado por projeto',
    row.name,
    String(row.blockedDays),
    'dias',
  ])

  const workload = summary.workload.flatMap<CsvRow>((row) => [
    ['distribuição de carga', row.person.name, formatNumber(row.averagePercentage), '%'],
    ['distribuição de carga', row.person.name, formatNumber(row.averageHours), 'horas'],
  ])

  const events = summary.events.map<CsvRow>((entry) => [
    'eventos por tipo',
    eventTypeLabels[entry.type],
    String(entry.count),
    'eventos',
  ])

  return [
    ...allocation,
    ...byPhase,
    ...durations,
    ...blockedMonths,
    ...blockedProjects,
    ...workload,
    ...events,
  ]
}

export function buildDashboardCsv(input: DashboardCsvInput): string {
  const rows: CsvRow[] = [
    HEADER,
    ...buildPeriodRows(input),
    ...buildKpiRows(input.summary),
    ...buildChartRows(input.summary, input.eventTypeLabels),
  ]

  return rows.map((row) => row.map(escapeField).join(',')).join('\n')
}

export function buildDashboardCsvFileName(summary: DashboardSummary): string {
  return `paineis-${summary.periodKey}-${summary.period.end}.csv`
}
