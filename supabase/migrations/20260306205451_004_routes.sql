-- 004: routes + route_items + route_subtasks

CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL DEFAULT '無題のルート',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  months INT NOT NULL DEFAULT 12,
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_routes_store ON routes(store_id);
CREATE INDEX idx_routes_owner ON routes(owner_user_id);

CREATE TABLE route_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id),
  sort_index INT NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#4472C4',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_rounds INT NOT NULL DEFAULT 1,
  difficulty INT NOT NULL DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  importance INT NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
  memo TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_route_items_route ON route_items(route_id);

CREATE TABLE route_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_item_id UUID NOT NULL REFERENCES route_items(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  sort_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_route_subtasks_item ON route_subtasks(route_item_id);
