import type { ConsistencyAlert } from '@/domain/today/consistencyAlerts'
import { AlertIcon } from '@/ui/primitives/AlertIcon'
import { Button } from '@/ui/primitives/Button'
import {
  ALERT_LEVELS,
  describeAlertBody,
  describeAlertMeta,
  describeAlertTitle,
} from './todayLabels'

type ConsistencyAlertListProps = {
  alerts: readonly ConsistencyAlert[]
  onOpenCapacity: () => void
}

export function ConsistencyAlertList({ alerts, onOpenCapacity }: ConsistencyAlertListProps) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-panel">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="grid gap-1.5 border-b border-border px-[11px] py-2.5 last:border-b-0 hover:bg-sunken"
        >
          <div className="flex items-center gap-[7px]">
            <AlertIcon level={ALERT_LEVELS[alert.kind]} size="small" />
            <span className="text-support font-semibold">{describeAlertTitle(alert)}</span>
            <span className="ml-auto font-mono text-micro tabular-nums text-text3">
              {describeAlertMeta(alert)}
            </span>
          </div>

          <p className="text-pretty text-support text-text2">{describeAlertBody(alert)}</p>

          {alert.kind === 'overload' && (
            <div className="flex gap-1.5">
              <Button size="small" onClick={onOpenCapacity}>
                Abrir capacidade
              </Button>
              <Button size="small" onClick={onOpenCapacity}>
                Simular remoção
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
