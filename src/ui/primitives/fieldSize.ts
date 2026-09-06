// Altura e tamanho de fonte são props, nunca className: entre duas utilidades da mesma
// propriedade quem decide é a ordem na folha de estilo, não a ordem na string de classes.
// O campo de busca da árvore de Notas fica entre dois passos do catálogo, em 26px, como o
// botão do card de decisão de Hoje ficou entre os dele.
export type FieldSize = 'small' | 'dense' | 'default' | 'medium' | 'large'
export type FieldTextSize = 'label' | 'support' | 'body'

export const FIELD_SIZE_CLASSES: Record<FieldSize, string> = {
  small: 'h-6',
  dense: 'h-[26px]',
  default: 'h-7',
  medium: 'h-[30px]',
  large: 'h-8',
}

export const FIELD_TEXT_CLASSES: Record<FieldTextSize, string> = {
  label: 'text-label font-normal tracking-normal',
  support: 'text-support',
  body: 'text-body',
}
