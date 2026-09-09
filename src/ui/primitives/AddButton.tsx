import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { classNames } from './classNames'
import { FOCUS_RING } from './focusRing'
import { KeyHint } from './KeyHint'

// O rodapé da coluna do Kanban usa o passo de 26px; o "+ Novo item" que mora dentro de uma
// lista continua nos 22px do design.
export type AddButtonSize = 'default' | 'medium'

const SIZE_CLASSES: Record<AddButtonSize, string> = {
  default: 'h-[22px] px-[7px]',
  medium: 'h-[26px] px-2',
}

type AddButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  keys?: string
  size?: AddButtonSize
  // Esticado pela trilha do rodapé, o rótulo encostado à esquerda ficaria solto no meio do vazio.
  centered?: boolean
  children: ReactNode
}

export function AddButton({
  keys,
  size = 'default',
  centered = false,
  children,
  className,
  type = 'button',
  ...buttonProps
}: AddButtonProps) {
  return (
    <button
      {...buttonProps}
      type={type}
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-[5px] border border-dashed border-border-strong bg-transparent text-label font-medium text-text3 hover:border-text3 hover:text-text',
        SIZE_CLASSES[size],
        centered ? 'justify-center' : '',
        FOCUS_RING,
        className,
      )}
    >
      {children}
      {keys !== undefined && <KeyHint keys={keys} variant="inline" />}
    </button>
  )
}
