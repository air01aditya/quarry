CREATE TABLE users (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE applications (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  company    TEXT NOT NULL,
  role       TEXT NOT NULL,
  job_url    TEXT,
  source     TEXT,
  status     TEXT NOT NULL DEFAULT 'saved'
             CHECK (status IN ('saved', 'applied', 'interview', 'offer', 'rejected', 'ghosted')),
  applied_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX applications_user_status_idx ON applications (user_id, status);
CREATE INDEX applications_user_applied_on_idx ON applications (user_id, applied_on DESC);

CREATE TABLE status_events (
  id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
  from_status    TEXT,
  to_status      TEXT NOT NULL,
  changed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX status_events_application_idx ON status_events (application_id, changed_at);

CREATE TABLE notes (
  id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
  body           TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notes_application_idx ON notes (application_id, created_at);
