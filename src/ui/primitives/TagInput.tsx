import { useState, type KeyboardEvent } from 'react'
import { classNames } from './classNames'
import { FIELD_FOCUS_RING } from './focusRing'
import { IconButton } from './IconButton'

const SEPARATORS = new Set([',', ';'])

type TagInputProps = {
  tags: readonly string[]
  onChange: (tags: readonly string[]) => void
  label: string
  placeholder?: string
  id?: string
  className?: string
}

export function TagInput({
  tags,
  onChange,
  label,
  placeholder = '+ tag',
  id,
  className,
}: TagInputProps) {
  const [draft, setDraft] = useState('')

  function addDraft() {
    const name = draft.trim().toLocaleLowerCase('pt-BR')

    setDraft('')

    if (name === '' || tags.includes(name)) {
      return
    }

    onChange([...tags, name])
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || SEPARATORS.has(event.key)) {
      event.preventDefault()
      addDraft()
      return
    }

    if (event.key === 'Backspace' && draft === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div
      className={classNames(
        'flex min-h-8 flex-wrap items-center gap-[5px] rounded-button border border-border-strong bg-bg px-1.5 py-1 focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent-soft',
        className,
      )}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1.5 rounded-badge border border-border bg-sunken px-[7px] py-0.5 text-label font-normal tracking-normal text-text2"
        >
          {tag}
          <IconButton
            size="small"
            label={`Remover ${tag}`}
            onClick={() => onChange(tags.filter((candidate) => candidate !== tag))}
            className="hover:bg-transparent hover:text-danger"
          >
            ✕
          </IconButton>
        </span>
      ))}
      <input
        id={id}
        aria-label={label}
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addDraft}
        className={classNames(
          'h-[22px] min-w-15 flex-1 border-0 bg-transparent text-label font-normal tracking-normal text-text placeholder:text-text3',
          FIELD_FOCUS_RING,
          'focus:border-0 focus:ring-0',
        )}
      />
    </div>
  )
}
