const BOLD_MARKER = '**'
const LINK_TARGET = /^(https?:\/\/\S+|[\w./-]+\.md)$/

export type TextSelection = {
  start: number
  end: number
}

export type TextEdit = {
  text: string
  selection: TextSelection
}

function replace(
  text: string,
  selection: TextSelection,
  replacement: string,
  caret: TextSelection,
): TextEdit {
  return {
    text: text.slice(0, selection.start) + replacement + text.slice(selection.end),
    selection: caret,
  }
}

function isWrapped(text: string, selection: TextSelection): boolean {
  return (
    text.slice(selection.start - BOLD_MARKER.length, selection.start) === BOLD_MARKER &&
    text.slice(selection.end, selection.end + BOLD_MARKER.length) === BOLD_MARKER
  )
}

// Aplicar negrito sobre um trecho já em negrito tira o negrito: o atalho é o mesmo, e deixar
// `****texto****` no arquivo seria o oposto do que a tecla promete.
export function applyBold(text: string, selection: TextSelection): TextEdit {
  const selected = text.slice(selection.start, selection.end)

  if (isWrapped(text, selection)) {
    const start = selection.start - BOLD_MARKER.length
    const end = selection.end + BOLD_MARKER.length

    return replace(
      text,
      { start, end },
      selected,
      { start, end: start + selected.length },
    )
  }

  const marked = `${BOLD_MARKER}${selected}${BOLD_MARKER}`
  const innerStart = selection.start + BOLD_MARKER.length

  return replace(text, selection, marked, {
    start: innerStart,
    end: innerStart + selected.length,
  })
}

// O que estava selecionado decide o lado em que ele cai: um endereço vai para os parênteses e
// o cursor espera o texto; qualquer outra coisa vira o texto e o cursor espera o endereço.
export function applyLink(text: string, selection: TextSelection): TextEdit {
  const selected = text.slice(selection.start, selection.end)

  if (selected === '' || LINK_TARGET.test(selected)) {
    const caret = selection.start + 1

    return replace(text, selection, `[](${selected})`, { start: caret, end: caret })
  }

  const caret = selection.start + selected.length + 3

  return replace(text, selection, `[${selected}]()`, { start: caret, end: caret })
}
