-- O CHECK de todo.status não é alterável em SQLite, e o caminho oficial de reconstrução exige
-- PRAGMA foreign_keys = off, que é ignorado dentro da transação do execute_batch. Por isso
-- todo_tag é reconstruída junto: dropar `todo` com a chave estrangeira ligada dispararia o
-- CASCADE dela. É o mesmo procedimento da migração 003.
CREATE TABLE todo_rebuilt (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
  status TEXT NOT NULL CHECK (
    status IN ('open', 'in_progress', 'blocked', 'done', 'cancelled')
  ),
  project_id TEXT REFERENCES project (id) ON DELETE SET NULL,
  task_id TEXT REFERENCES task (id) ON DELETE SET NULL,
  completed_at TEXT,
  recurrence_id TEXT REFERENCES todo_recurrence (id) ON DELETE SET NULL,
  CHECK (completed_at IS NULL OR status = 'done')
);

INSERT INTO todo_rebuilt (
  id, title, description, due_date, priority, status, project_id, task_id, completed_at,
  recurrence_id
)
SELECT id, title, description, due_date, priority, status, project_id, task_id, completed_at,
       recurrence_id
FROM todo;

CREATE TABLE todo_tag_rebuilt (
  todo_id TEXT NOT NULL REFERENCES todo_rebuilt (id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tag (id) ON DELETE CASCADE,
  PRIMARY KEY (todo_id, tag_id)
);

INSERT INTO todo_tag_rebuilt (todo_id, tag_id)
SELECT todo_id, tag_id FROM todo_tag;

DROP TABLE todo_tag;

DROP TABLE todo;

ALTER TABLE todo_rebuilt RENAME TO todo;

ALTER TABLE todo_tag_rebuilt RENAME TO todo_tag;

CREATE INDEX idx_todo_status_due ON todo (status, due_date);

CREATE INDEX idx_todo_project ON todo (project_id);

CREATE INDEX idx_todo_task ON todo (task_id);

CREATE INDEX idx_todo_recurrence ON todo (recurrence_id);

CREATE INDEX idx_todo_tag_tag ON todo_tag (tag_id);
