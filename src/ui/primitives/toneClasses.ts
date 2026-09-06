import type { BadgeTone } from './Badge'

// O ponto do selo e a barra do gráfico pintam a mesma cor de tom; sem um mapa só, as duas
// listas sairiam de sincronia na primeira cor nova.
export const TONE_BACKGROUND_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-text3',
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  info: 'bg-info',
  accent: 'bg-accent',
  scope: 'bg-event-scope',
}
