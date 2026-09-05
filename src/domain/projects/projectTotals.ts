import type { ProjectRow } from './projectRow'

export type ProjectsTotals = {
  effortHours: number
  taskCount: number
  projectCount: number
  delayedCount: number
  atRiskCount: number
}

export function sumProjectsTotals(rows: readonly ProjectRow[]): ProjectsTotals {
  return {
    effortHours: rows.reduce((total, row) => total + row.effortHours, 0),
    taskCount: rows.reduce((total, row) => total + row.countedTaskCount, 0),
    projectCount: rows.length,
    delayedCount: rows.filter((row) => row.isDelayed).length,
    atRiskCount: rows.filter((row) => row.hasOpenRisk).length,
  }
}
