import { describe, expect, it } from 'vitest'
import { isGridMoveKey, resolveCellMove, resolveRowMove } from './gridNavigationKeys'

const ROWS = ['gateway', 'parceiro', 'campo']

describe('isGridMoveKey', () => {
  it('Should recognise the four keys that move between rows', () => {
    expect(['ArrowUp', 'ArrowDown', 'Home', 'End'].every(isGridMoveKey)).toBe(true)
  })

  it('Should not claim the keys that act on the row', () => {
    expect(isGridMoveKey('Enter')).toBe(false)
    expect(isGridMoveKey(' ')).toBe(false)
    expect(isGridMoveKey('ArrowRight')).toBe(false)
  })
})

describe('resolveRowMove', () => {
  it('Should stay put when the table has no row', () => {
    expect(resolveRowMove([], null, 'ArrowDown')).toBeNull()
  })

  it('Should move to the next row going down', () => {
    expect(resolveRowMove(ROWS, 'gateway', 'ArrowDown')).toBe('parceiro')
  })

  it('Should move to the previous row going up', () => {
    expect(resolveRowMove(ROWS, 'parceiro', 'ArrowUp')).toBe('gateway')
  })

  it('Should stop at the last row instead of wrapping around', () => {
    expect(resolveRowMove(ROWS, 'campo', 'ArrowDown')).toBeNull()
  })

  it('Should stop at the first row instead of wrapping around', () => {
    expect(resolveRowMove(ROWS, 'gateway', 'ArrowUp')).toBeNull()
  })

  it('Should jump to the ends with Home and End', () => {
    expect(resolveRowMove(ROWS, 'parceiro', 'Home')).toBe('gateway')
    expect(resolveRowMove(ROWS, 'parceiro', 'End')).toBe('campo')
  })

  it('Should enter the table by the first row when nothing is active yet', () => {
    expect(resolveRowMove(ROWS, null, 'ArrowDown')).toBe('gateway')
  })

  it('Should enter the table by the last row when going up from nowhere', () => {
    expect(resolveRowMove(ROWS, null, 'ArrowUp')).toBe('campo')
  })

  it('Should enter by the first row when the active row left the list', () => {
    expect(resolveRowMove(ROWS, 'saiu-do-filtro', 'ArrowDown')).toBe('gateway')
  })
})

describe('resolveCellMove', () => {
  const bounds = { rowCount: 4, columnCount: 12 }

  it('Should walk in all four directions', () => {
    expect(resolveCellMove({ row: 1, column: 1 }, bounds, 'ArrowDown')).toEqual({
      row: 2,
      column: 1,
    })
    expect(resolveCellMove({ row: 1, column: 1 }, bounds, 'ArrowUp')).toEqual({
      row: 0,
      column: 1,
    })
    expect(resolveCellMove({ row: 1, column: 1 }, bounds, 'ArrowRight')).toEqual({
      row: 1,
      column: 2,
    })
    expect(resolveCellMove({ row: 1, column: 1 }, bounds, 'ArrowLeft')).toEqual({
      row: 1,
      column: 0,
    })
  })

  it('Should stay put at the edges instead of wrapping around', () => {
    expect(resolveCellMove({ row: 0, column: 0 }, bounds, 'ArrowUp')).toBeNull()
    expect(resolveCellMove({ row: 0, column: 0 }, bounds, 'ArrowLeft')).toBeNull()
    expect(resolveCellMove({ row: 3, column: 11 }, bounds, 'ArrowDown')).toBeNull()
    expect(resolveCellMove({ row: 3, column: 11 }, bounds, 'ArrowRight')).toBeNull()
  })

  it('Should send Home and End to the ends of the row', () => {
    expect(resolveCellMove({ row: 2, column: 5 }, bounds, 'Home')).toEqual({ row: 2, column: 0 })
    expect(resolveCellMove({ row: 2, column: 5 }, bounds, 'End')).toEqual({ row: 2, column: 11 })
  })

  it('Should send Home and End to the ends of the matrix with the modifier', () => {
    expect(resolveCellMove({ row: 2, column: 5 }, bounds, 'Home', true)).toEqual({
      row: 0,
      column: 0,
    })
    expect(resolveCellMove({ row: 2, column: 5 }, bounds, 'End', true)).toEqual({
      row: 3,
      column: 11,
    })
  })

  it('Should refuse to move inside an empty matrix', () => {
    expect(
      resolveCellMove({ row: 0, column: 0 }, { rowCount: 0, columnCount: 0 }, 'ArrowDown'),
    ).toBeNull()
  })
})
