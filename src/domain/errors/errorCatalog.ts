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
  PHASE_HAS_TASKS:
    'Esta fase tem tarefas. Mova as tarefas para outra fase antes de excluí-la.',
  DATA_FOLDER_UNREADABLE: 'Não foi possível ler a pasta de dados.',
  NOTES_FOLDER_UNREADABLE: 'Não foi possível ler a pasta de notas.',
  NOTE_READ_FAILED: 'Não foi possível abrir o arquivo da nota.',
  NOTE_WRITE_FAILED: 'Não foi possível gravar a nota na pasta de dados.',
  EXPORT_FAILED: 'Não foi possível gravar a exportação na pasta de dados.',
  SHORTCUT_CONFLICT: 'Dois comandos disputam o mesmo atalho.',
  RECORD_NOT_FOUND: 'O registro não foi encontrado.',
  INVALID_RECORD_SHAPE: 'Um registro do banco está em formato inesperado.',
} as const

export type ErrorCode = keyof typeof ERROR_CATALOG
