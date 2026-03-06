-- 003: books + chapters + sections + resources + org_book_library

CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  target_grade TEXT NOT NULL DEFAULT '',
  fields JSONB NOT NULL DEFAULT '[]',
  tags JSONB NOT NULL DEFAULT '[]',
  total_pages INT NOT NULL DEFAULT 0,
  cover_image_url TEXT,
  description TEXT NOT NULL DEFAULT '',

  -- 所有と公開
  creator_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  published_at TIMESTAMPTZ,

  -- 人気指標（非正規化、定期集計）
  usage_count INT NOT NULL DEFAULT 0,
  like_count INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_books_subject ON books(subject);
CREATE INDEX idx_books_visibility ON books(visibility) WHERE visibility = 'public';
CREATE INDEX idx_books_org ON books(organization_id);
CREATE INDEX idx_books_creator ON books(creator_user_id);
CREATE INDEX idx_books_usage ON books(usage_count DESC) WHERE visibility = 'public';

CREATE TABLE book_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  sort_index INT NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT '',
  start_page INT NOT NULL DEFAULT 0,
  end_page INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_book_chapters_book ON book_chapters(book_id);

CREATE TABLE book_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES book_chapters(id) ON DELETE CASCADE,
  sort_index INT NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT '',
  start_page INT NOT NULL DEFAULT 0,
  end_page INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_book_sections_chapter ON book_sections(chapter_id);

CREATE TABLE book_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('video', 'link', 'file')),
  url TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  sort_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_book_resources_book ON book_resources(book_id);

CREATE TABLE org_book_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, book_id)
);

CREATE INDEX idx_org_book_library_org ON org_book_library(organization_id);
