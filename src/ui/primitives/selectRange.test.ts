import { describe, expect, it } from 'vitest'
import { selectRange } from './selectRange'

const ROWS = ['a', 'b', 'c', 'd', 'e']

describe('selectRange', () => {
  it('Should return every row between the anchor and the target', () => {
    expect(selectRange(ROWS, 'b', 'd')).toEqual(['b', 'c', 'd'])
  })

  it('Should read the range backwards the same way', () => {
    expect(selectRange(ROWS, 'd', 'b')).toEqual(['b', 'c', 'd'])
  })

  it('Should return a single row when anchor and target are the same', () => {
    expect(selectRange(ROWS, 'c', 'c')).toEqual(['c'])
  })

  it('Should return nothing when a row is not in the list', () => {
    expect(selectRange(ROWS, 'a', 'z')).toEqual([])
    expect(selectRange(ROWS, 'z', 'a')).toEqual([])
  })

  it('Should span the whole list from the first to the last row', () => {
    expect(selectRange(ROWS, 'a', 'e')).toEqual(ROWS)
  })
})
