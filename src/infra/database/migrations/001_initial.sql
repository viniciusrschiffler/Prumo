CREATE TABLE person (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  role TEXT,
  weekly_capacity_hours REAL NOT NULL DEFAULT 40,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE TABLE phase (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  color TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE TABLE project (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (
    status IN ('discovery', 'active', 'blocked', 'paused', 'completed', 'cancelled')
  ),
  priority TEXT NOT NULL CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
  owner_person_id TEXT REFERENCES person (id) ON DELETE SET NULL,
  planned_start TEXT,
  planned_end TEXT,
  created_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE TABLE tag (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE project_tag (
  project_id TEXT NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tag (id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);

CREATE TABLE task (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  phase_id TEXT NOT NULL REFERENCES phase (id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('todo', 'in_progress', 'done', 'blocked', 'cancelled')
  ),
  planned_start TEXT,
  planned_end TEXT,
  actual_start TEXT,
  actual_end TEXT,
  estimated_hours REAL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE task_dependency (
  task_id TEXT NOT NULL REFERENCES task (id) ON DELETE CASCADE,
  depends_on_task_id TEXT NOT NULL REFERENCES task (id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, depends_on_task_id),
  CHECK (task_id <> depends_on_task_id)
);

CREATE TABLE allocation (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES task (id) ON DELETE CASCADE,
  person_id TEXT NOT NULL REFERENCES person (id) ON DELETE RESTRICT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  percentage REAL NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  ended_at TEXT,
  ended_reason TEXT,
  CHECK (end_date >= start_date),
  CHECK (ended_reason IS NULL OR ended_at IS NOT NULL)
);

CREATE TABLE project_event (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN ('decision', 'scope_change', 'block', 'unblock', 'reallocation', 'risk', 'note')
  ),
  event_date TEXT NOT NULL,
  title TEXT NOT NULL,
  body_md TEXT,
  reverts_event_id TEXT REFERENCES project_event (id) ON DELETE SET NULL,
  risk_open INTEGER NOT NULL DEFAULT 0 CHECK (risk_open IN (0, 1)),
  expected_resume_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE project_event_task (
  project_event_id TEXT NOT NULL REFERENCES project_event (id) ON DELETE CASCADE,
  task_id TEXT NOT NULL REFERENCES task (id) ON DELETE CASCADE,
  PRIMARY KEY (project_event_id, task_id)
);

CREATE TABLE baseline (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  reason TEXT NOT NULL,
  UNIQUE (project_id, version)
);

CREATE TABLE baseline_task (
  baseline_id TEXT NOT NULL REFERENCES baseline (id) ON DELETE CASCADE,
  task_id TEXT NOT NULL REFERENCES task (id) ON DELETE CASCADE,
  planned_start TEXT,
  planned_end TEXT,
  estimated_hours REAL,
  PRIMARY KEY (baseline_id, task_id)
);

CREATE TABLE todo_recurrence (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  rule TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  last_generated_at TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE TABLE todo (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
  status TEXT NOT NULL CHECK (status IN ('open', 'done', 'cancelled')),
  project_id TEXT REFERENCES project (id) ON DELETE SET NULL,
  task_id TEXT REFERENCES task (id) ON DELETE SET NULL,
  completed_at TEXT,
  recurrence_id TEXT REFERENCES todo_recurrence (id) ON DELETE SET NULL,
  CHECK (completed_at IS NULL OR status = 'done')
);

CREATE TABLE todo_tag (
  todo_id TEXT NOT NULL REFERENCES todo (id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tag (id) ON DELETE CASCADE,
  PRIMARY KEY (todo_id, tag_id)
);

CREATE TABLE note (
  path TEXT PRIMARY KEY,
  project_id TEXT REFERENCES project (id) ON DELETE SET NULL,
  project_event_id TEXT REFERENCES project_event (id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE saved_view (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  screen TEXT NOT NULL,
  filters_json TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE setting (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX idx_project_status ON project (status);
CREATE INDEX idx_project_owner ON project (owner_person_id);
CREATE INDEX idx_project_planned_period ON project (planned_start, planned_end);

CREATE INDEX idx_project_tag_tag ON project_tag (tag_id);

CREATE INDEX idx_task_project ON task (project_id);
CREATE INDEX idx_task_phase ON task (phase_id);
CREATE INDEX idx_task_planned_period ON task (planned_start, planned_end);
CREATE INDEX idx_task_actual_period ON task (actual_start, actual_end);

CREATE INDEX idx_task_dependency_depends_on ON task_dependency (depends_on_task_id);

CREATE INDEX idx_allocation_task ON allocation (task_id);
CREATE INDEX idx_allocation_person ON allocation (person_id);
CREATE INDEX idx_allocation_period ON allocation (start_date, end_date);
CREATE INDEX idx_allocation_open ON allocation (person_id, start_date, end_date) WHERE ended_at IS NULL;

CREATE INDEX idx_project_event_project ON project_event (project_id);
CREATE INDEX idx_project_event_date ON project_event (event_date);
CREATE INDEX idx_project_event_type ON project_event (type, event_date);
CREATE INDEX idx_project_event_open_risk ON project_event (project_id) WHERE risk_open = 1;

CREATE INDEX idx_project_event_task_task ON project_event_task (task_id);

CREATE INDEX idx_baseline_project ON baseline (project_id, version);
CREATE INDEX idx_baseline_task_task ON baseline_task (task_id);

CREATE INDEX idx_todo_status_due ON todo (status, due_date);
CREATE INDEX idx_todo_project ON todo (project_id);
CREATE INDEX idx_todo_task ON todo (task_id);
CREATE INDEX idx_todo_recurrence ON todo (recurrence_id);

CREATE INDEX idx_todo_tag_tag ON todo_tag (tag_id);

CREATE INDEX idx_note_project ON note (project_id);
CREATE INDEX idx_note_event ON note (project_event_id);

CREATE INDEX idx_saved_view_screen ON saved_view (screen, sort_order);

CREATE VIRTUAL TABLE project_event_search USING fts5 (
  title,
  body_md,
  content = 'project_event',
  content_rowid = 'rowid'
);

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

CREATE VIRTUAL TABLE note_search USING fts5 (
  path UNINDEXED,
  content
);
