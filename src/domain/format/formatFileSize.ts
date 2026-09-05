const UNITS = ['B', 'kB', 'MB', 'GB', 'TB'] as const
const STEP = 1000

function formatNumber(value: number, decimals: number): string {
  return value.toFixed(decimals).replace('.', ',')
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '—'
  }

  let value = bytes
  let unitIndex = 0

  while (value >= STEP && unitIndex < UNITS.length - 1) {
    value /= STEP
    unitIndex += 1
  }

  const decimals = unitIndex <= 1 ? 0 : 1

  // Arredondar pode empurrar o valor para o próximo degrau: 999 600 B vira 1000 kB, não 1 MB.
  if (Number(value.toFixed(decimals)) >= STEP && unitIndex < UNITS.length - 1) {
    value /= STEP
    unitIndex += 1
  }

  return `${formatNumber(value, unitIndex <= 1 ? 0 : 1)} ${UNITS[unitIndex]}`
}
