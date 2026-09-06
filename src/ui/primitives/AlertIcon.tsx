import { classNames } from './classNames'

export type AlertLevel = 'danger' | 'warn' | 'ok' | 'info'

// O aviso do catálogo desenha o disco em 16px; a linha de alerta da tela de Hoje, em 14px.
export type AlertIconSize = 'default' | 'small'

const ICON_CLASSES: Record<AlertLevel, string> = {
  danger: 'rounded-full bg-danger text-accent-fg',
  warn: 'rounded-[3px] bg-warn text-accent-fg',
  ok: 'rounded-full bg-ok text-accent-fg',
  info: 'rounded-full border border-border-strong text-text2',
}

const SIZE_CLASSES: Record<AlertIconSize, string> = {
  default: 'h-4 w-4 text-label',
  small: 'h-3.5 w-3.5 text-micro',
}

const ICON_GLYPH: Record<AlertLevel, string> = {
  danger: '!',
  warn: '△',
  ok: '✓',
  info: 'i',
}

type AlertIconProps = {
  level: AlertLevel
  size?: AlertIconSize
  className?: string
}

export function AlertIcon({ level, size = 'default', className }: AlertIconProps) {
  return (
    <span
      aria-hidden="true"
      className={classNames(
        'inline-flex flex-none items-center justify-center font-bold',
        SIZE_CLASSES[size],
        ICON_CLASSES[level],
        className,
      )}
    >
      {ICON_GLYPH[level]}
    </span>
  )
}
