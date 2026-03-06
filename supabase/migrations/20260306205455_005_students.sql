-- 005: students + student_routes + study_logs

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  student_code TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  grade TEXT,
  school_name TEXT,
  target_school TEXT,
  current_deviation REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, student_code)
);

CREATE INDEX idx_students_store ON students(store_id);

CREATE TABLE student_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  start_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, route_id)
);

CREATE INDEX idx_student_routes_student ON student_routes(student_id);

CREATE TABLE study_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  minutes INT NOT NULL CHECK (minutes >= 0),
  book_id UUID NOT NULL REFERENCES books(id),
  understanding TEXT NOT NULL CHECK (understanding IN ('good', 'ok', 'bad')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_study_logs_student ON study_logs(student_id);
CREATE INDEX idx_study_logs_date ON study_logs(student_id, date);
