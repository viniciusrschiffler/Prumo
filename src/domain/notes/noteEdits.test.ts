import { describe, expect, it } from 'vitest'
import { applyBold, applyLink } from './noteEdits'

describe('applyBold', () => {
  it('Should wrap the selection and keep it selected', () => {
    const edit = applyBold('mudança de escopo', { start: 8, end: 17 })

    expect(edit.text).toBe('mudança **de escopo**')
    expect(edit.text.slice(edit.selection.start, edit.selection.end)).toBe('de escopo')
  })

  it('Should take the marks off a selection that already carries them', () => {
    const edit = applyBold('mudança **de escopo**', { start: 10, end: 19 })

    expect(edit.text).toBe('mudança de escopo')
    expect(edit.text.slice(edit.selection.start, edit.selection.end)).toBe('de escopo')
  })

  it('Should leave the cursor between the marks with nothing selected', () => {
    const edit = applyBold('texto', { start: 5, end: 5 })

    expect(edit.text).toBe('texto****')
    expect(edit.selection).toEqual({ start: 7, end: 7 })
  })
})

describe('applyLink', () => {
  it('Should turn the selection into the link text and wait for the address', () => {
    const edit = applyLink('ver a baseline antes', { start: 6, end: 14 })

    expect(edit.text).toBe('ver a [baseline]() antes')
    expect(edit.selection).toEqual({ start: 17, end: 17 })
  })

  it('Should put a selected address in the parentheses and wait for the text', () => {
    const edit = applyLink('ver notas/baseline.md', { start: 4, end: 21 })

    expect(edit.text).toBe('ver [](notas/baseline.md)')
    expect(edit.selection).toEqual({ start: 5, end: 5 })
  })

  it('Should read a full URL as an address too', () => {
    expect(applyLink('https://exemplo/x', { start: 0, end: 17 }).text).toBe(
      '[](https://exemplo/x)',
    )
  })

  it('Should leave an empty link with the cursor in the brackets, where the text goes', () => {
    const edit = applyLink('texto ', { start: 6, end: 6 })

    expect(edit.text).toBe('texto []()')
    expect(edit.selection).toEqual({ start: 7, end: 7 })
  })
})
