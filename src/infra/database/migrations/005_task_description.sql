-- A descrição da tarefa é coluna nova e opcional, então o ALTER basta: o CHECK do status
-- continua o mesmo e nenhuma tabela referencia `task` por gatilho.
ALTER TABLE task ADD COLUMN description TEXT;
