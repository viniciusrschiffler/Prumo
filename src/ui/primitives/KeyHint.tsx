import { classNames } from './classNames'
import { formatKeyTokens } from './formatKeyTokens'

export type KeyHintVariant = 'cap' | 'muted' | 'nav' | 'inline'

const CAP_CLASSES: Record<KeyHintVariant, string> = {
  cap: 'min-w-[18px] rounded-badge border border-border-strong border-b-2 bg-sunken px-[5px] py-px text-center text-micro text-text',
  muted: 'rounded-[3px] border border-border bg-sunken px-[5px] py-px text-micro text-text2',
  nav: 'rounded-[3px] border border-border bg-panel px-1 text-[9px] text-text3',
  inline: 'text-micro opacity-70',
}

type KeyHintProps = {
  keys: string
  variant?: KeyHintVariant
  className?: string
}

export function KeyHint({ keys, variant = 'cap', className }: KeyHintProps) {
  const tokens = formatKeyTokens(keys)

  return (
    <span className={classNames('inline-flex gap-[3px] font-mono', className)}>
      {tokens.map((token, index) => (
        <span key={`${token}-${index}`} className={CAP_CLASSES[variant]}>
          {token}
        </span>
      ))}
    </span>
  )
}
