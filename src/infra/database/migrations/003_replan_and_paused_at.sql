ALTER TABLE project ADD COLUMN paused_at TEXT;

-- O CHECK de project_event.type não é alterável em SQLite, e o caminho oficial de reconstrução
-- exige PRAGMA foreign_keys = off, que é ignorado dentro da transação do execute_batch. Por isso
-- as três tabelas do vínculo são reconstruídas em ordem, sem nenhum DELETE: dropar project_event
-- com a chave estrangeira ligada dispararia o CASCADE de project_event_task e o SET NULL de note.
-- O rowid viaja junto na cópia para o índice FTS continuar apontando para a linha certa.
DROP TRIGGER project_event_search_after_insert;

DROP TRIGGER project_event_search_after_delete;

DROP TRIGGER project_event_search_after_update;

CREATE TABLE project_event_rebuilt (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN (
      'decision', 'scope_change', 'replan', 'block', 'unblock', 'reallocation', 'risk', 'note'
    )
  ),
  event_date TEXT NOT NULL,
  title TEXT NOT NULL,
  body_md TEXT,
  reverts_event_id TEXT REFERENCES project_event_rebuilt (id) ON DELETE SET NULL,
  risk_open INTEGER NOT NULL DEFAULT 0 CHECK (risk_open IN (0, 1)),
  expected_resume_at TEXT,
  created_at TEXT NOT NULL
);

INSERT INTO project_event_rebuilt (
  rowid, id, project_id, type, event_date, title, body_md, reverts_event_id, risk_open,
  expected_resume_at, created_at
)
SELECT rowid, id, project_id, type, event_date, title, body_md, reverts_event_id, risk_open,
       expected_resume_at, created_at
FROM project_event;

CREATE TABLE project_event_task_rebuilt (
  project_event_id TEXT NOT NULL REFERENCES project_event_rebuilt (id) ON DELETE CASCADE,
  task_id TEXT NOT NULL REFERENCES task (id) ON DELETE CASCADE,
  PRIMARY KEY (project_event_id, task_id)
);

INSERT INTO project_event_task_rebuilt (project_event_id, task_id)
SELECT project_event_id, task_id FROM project_event_task;

CREATE TABLE note_rebuilt (
  path TEXT PRIMARY KEY,
  project_id TEXT REFERENCES project (id) ON DELETE SET NULL,
  project_event_id TEXT REFERENCES project_event_rebuilt (id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO note_rebuilt (path, project_id, project_event_id, updated_at)
SELECT path, project_id, project_event_id, updated_at FROM note;

DROP TABLE project_event_task;

DROP TABLE note;

DROP TABLE project_event;

ALTER TABLE project_event_rebuilt RENAME TO project_event;

ALTER TABLE project_event_task_rebuilt RENAME TO project_event_task;

ALTER TABLE note_rebuilt RENAME TO note;

CREATE INDEX idx_project_event_project ON project_event (project_id);

CREATE INDEX idx_project_event_date ON project_event (event_date);

CREATE INDEX idx_project_event_type ON project_event (type, event_date);

CREATE INDEX idx_project_event_open_risk ON project_event (project_id) WHERE risk_open = 1;

CREATE INDEX idx_project_event_task_task ON project_event_task (task_id);

CREATE INDEX idx_note_project ON note (project_id);

CREATE INDEX idx_note_event ON note (project_event_id);

CREATE TRIGGER project_event_search_after_insert AFTER INSERT ON project_event BEGIN
  INSERT INTO project_event_search (rowid, title, body_md)
  VALUES (new.rowid, new.title, new.body_md);
END;

CREATE TRIGGER project_event_search_after_delete AFTER DELETE ON project_event BEGIN
  INSERT INTO project_event_search (project_event_search, rowid, title, body_md)
  VALUES ('delete', old.rowid, old.title, old.body_md);
END;

CREATE TRIGGER project_event_search_after_update AFTER UPDATE ON project_event BEGIN
  INSERT INTO project_event_search (project_event_search, rowid, title, body_md)
  VALUES ('delete', old.rowid, old.title, old.body_md);
  INSERT INTO project_event_search (rowid, title, body_md)
  VALUES (new.rowid, new.title, new.body_md);
END;

INSERT INTO project_event_search (project_event_search) VALUES ('rebuild');
