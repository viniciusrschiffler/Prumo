export const ERROR_CATALOG = {
  DATABASE_NOT_OPEN: 'O banco de dados ainda não foi aberto.',
  DATABASE_OPEN_FAILED: 'Não foi possível abrir o banco de dados na pasta escolhida.',
  MIGRATION_FAILED: 'Não foi possível preparar o banco de dados. As alterações não foram gravadas.',
  MIGRATION_VERSION_AHEAD:
    'Esta pasta foi usada por uma versão mais nova do Prumo. Atualize o aplicativo para abri-la.',
  TRANSACTION_FAILED:
    'Não foi possível concluir a operação. Nenhuma alteração foi gravada.',
  PERSON_HAS_HISTORY:
    'Esta pessoa tem alocações registradas. Marque como inativa para preservar o histórico.',
  SHORTCUT_CONFLICT: 'Dois comandos disputam o mesmo atalho.',
  RECORD_NOT_FOUND: 'O registro não foi encontrado.',
  INVALID_RECORD_SHAPE: 'Um registro do banco está em formato inesperado.',
} as const

export type ErrorCode = keyof typeof ERROR_CATALOG
