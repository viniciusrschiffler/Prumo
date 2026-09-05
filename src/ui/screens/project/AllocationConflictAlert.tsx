import type { AllocationConflict } from '@/domain/projects/allocationConflicts'
import { formatIsoDate } from '@/domain/format/displayDate'
import { Alert } from '@/ui/primitives/Alert'

function describeContributions(conflict: AllocationConflict): string {
  return conflict.contributions
    .map((contribution) =>
      contribution.isSameProject
        ? `${contribution.allocation.percentage}% em ${contribution.taskTitle} aqui`
        : `${contribution.allocation.percentage}% em ${contribution.projectName}`,
    )
    .join(' e ')
}

type AllocationConflictAlertProps = {
  conflict: AllocationConflict
}

export function AllocationConflictAlert({ conflict }: AllocationConflictAlertProps) {
  return (
    <Alert
      level="warn"
      title={`${conflict.person.name} soma ${conflict.totalPercentage}% entre ${formatIsoDate(
        conflict.period.start,
      )} e ${formatIsoDate(conflict.period.end)}`}
    >
      {describeContributions(conflict)}. Capacidade {conflict.person.weeklyCapacityHours}h/semana.
    </Alert>
  )
}
