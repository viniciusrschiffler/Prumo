import { describe, expect, it } from 'vitest'
import { formatFileSize } from './formatFileSize'

describe('formatFileSize', () => {
  it('Should print the sizes the design shows', () => {
    expect(formatFileSize(42_000)).toBe('42 kB')
    expect(formatFileSize(3000)).toBe('3 kB')
    expect(formatFileSize(11_000)).toBe('11 kB')
  })

  it('Should keep small files in bytes', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(999)).toBe('999 B')
    expect(formatFileSize(1000)).toBe('1 kB')
  })

  it('Should use one decimal with a comma from megabytes up', () => {
    expect(formatFileSize(1_500_000)).toBe('1,5 MB')
    expect(formatFileSize(2_400_000_000)).toBe('2,4 GB')
  })

  it('Should climb a step when the rounding reaches the next one', () => {
    expect(formatFileSize(999_600)).toBe('1,0 MB')
  })

  it('Should report a dash for a size that makes no sense', () => {
    expect(formatFileSize(-1)).toBe('—')
    expect(formatFileSize(Number.NaN)).toBe('—')
  })
})
