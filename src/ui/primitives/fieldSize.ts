// Altura e tamanho de fonte são props, nunca className: entre duas utilidades da mesma
// propriedade quem decide é a ordem na folha de estilo, não a ordem na string de classes.
export type FieldSize = 'small' | 'default' | 'large'
export type FieldTextSize = 'label' | 'support' | 'body'

export const FIELD_SIZE_CLASSES: Record<FieldSize, string> = {
  small: 'h-6',
  default: 'h-7',
  large: 'h-8',
}

export const FIELD_TEXT_CLASSES: Record<FieldTextSize, string> = {
  label: 'text-label font-normal tracking-normal',
  support: 'text-support',
  body: 'text-body',
}
