import { Badge } from './Badge'

// Atrasado e Risco são derivados, nunca status gravado. Ficam separados do StatusBadge
// para que nenhuma tela possa renderizá-los a partir de uma coluna do banco.

export function DelayedBadge() {
  return (
    <Badge tone="danger" variant="solid" uppercase>
      Atrasado
    </Badge>
  )
}

export function RiskBadge() {
  return (
    <Badge tone="warn" bordered uppercase>
      Risco
    </Badge>
  )
}
