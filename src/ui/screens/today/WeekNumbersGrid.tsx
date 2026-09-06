import type { WeekNumbers } from '@/domain/today/weekNumbers'
import { StatCard } from '@/ui/primitives/StatCard'

type WeekNumbersGridProps = {
  week: WeekNumbers
}

export function WeekNumbersGrid({ week }: WeekNumbersGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <StatCard label="Capacidade usada">{week.capacityUsedPercentage}%</StatCard>
      <StatCard label="Dias bloqueados" tone={week.blockedDays > 0 ? 'danger' : 'default'}>
        {week.blockedDays}
      </StatCard>
      <StatCard label="Eventos registrados">{week.eventCount}</StatCard>
      <StatCard label="Todos concluídos" tone={week.completedTodoCount > 0 ? 'ok' : 'default'}>
        {week.completedTodoCount}
      </StatCard>
    </div>
  )
}
