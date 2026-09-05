import { describe, expect, it } from 'vitest'
import { isGridMoveKey, resolveRowMove } from './gridNavigationKeys'

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
