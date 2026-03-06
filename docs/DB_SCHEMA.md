# データベース設計

Supabase (PostgreSQL) 想定。

## ER概要

```
organizations 1──1 subscriptions
organizations 1──* stores
organizations 1──* org_book_library
stores 1──* memberships
stores 1──* students
stores 1──* routes
routes 1──* route_items
route_items 1──* route_subtasks
students 1──* student_routes
routes 1──* student_routes
students 1──* study_logs
books 1──* route_items
books 1──* book_chapters
books 1──* book_resources
book_chapters 1──* book_sections
```

---

## サブスクリプションプラン

| | Free | Pro ¥4,980/月 | Team ¥14,800/月 |
|---|---|---|---|
| 校舎 | - | 1 | 1（追加 +¥10,000/校舎） |
| 講師 | - | 3 | 無制限 |
| 生徒 | - | 50 | 無制限 |
| PDF | 透かし | A4/A3 透かしなし | A4/A3 透かしなし |
| 教材公開 | - | ○ | ○ |
| 動画/リンク | - | 3件/教材 | 無制限 |
| 学習ログ | - | ○ | ○ |
| ダッシュボード | - | 基本 | 全校舎横断 |

---

## 認証方式

| ロール | 認証方式 | テーブル |
|---|---|---|
| 講師/オーナー | Supabase Auth (Email/Google) | auth.users → memberships |
| 生徒 | 疑似認証 (store_code + student_code + PIN) | students → httpOnly cookie |
| ゲスト | なし | LocalStorage |

---

## テーブル定義

### 1. organizations（塾法人）

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2. subscriptions（サブスクリプション）

organizations と 1:1。Stripe Webhook で同期。

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  extra_stores INT NOT NULL DEFAULT 0,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE UNIQUE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
```

プラン制限の算出:
- **max_stores**: free=0, pro=1, team=1+extra_stores
- **max_teachers**: free=0, pro=3, team=unlimited(-1)
- **max_students**: free=0, pro=50, team=unlimited(-1)
- **max_resources_per_book**: free=0, pro=3, team=unlimited(-1)

### 3. stores（校舎）

```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  store_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stores_org ON stores(organization_id);
```

### 4. memberships（講師所属）

```sql
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('owner', 'admin', 'teacher')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, store_id)
);

CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_store ON memberships(store_id);
CREATE INDEX idx_memberships_org ON memberships(organization_id);
```

### 5. books（教材カタログ — グローバル）

全ユーザー共通の教材マスタ。private/public で公開範囲を制御。

```sql
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
```

### 6. book_chapters

```sql
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
```

### 7. book_sections

```sql
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
```

### 8. book_resources（動画・リンク・ファイル）

```sql
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
```

### 9. org_book_library（組織のライブラリ）

公開教材を「ライブラリに追加」した記録。データのコピーはしない。

```sql
CREATE TABLE org_book_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, book_id)
);

CREATE INDEX idx_org_book_library_org ON org_book_library(organization_id);
```

### 10. routes

```sql
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
```

### 11. route_items（ガントの1行＝教材）

```sql
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
```

### 12. route_subtasks（タスク分割）

```sql
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
```

### 13. students（疑似ユーザー）

Supabase Auth は使わない。store_code + student_code + PIN で認証。

```sql
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
```

### 14. student_routes（ルート割当）

```sql
CREATE TABLE student_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  start_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, route_id)
);

CREATE INDEX idx_student_routes_student ON student_routes(student_id);
```

### 15. study_logs（学習ログ）

```sql
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
```

---

## RLS（Row Level Security）方針

### 講師（Supabase Auth）

講師は `memberships` 経由で所属 `store_id` / `organization_id` が決まる。

```sql
-- ヘルパー関数: ユーザーの所属organization_idを返す
CREATE OR REPLACE FUNCTION user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT DISTINCT organization_id FROM memberships WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ヘルパー関数: ユーザーの所属store_idを返す
CREATE OR REPLACE FUNCTION user_store_ids()
RETURNS SETOF UUID AS $$
  SELECT store_id FROM memberships WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

```sql
-- routes: 所属店舗のルートのみ
CREATE POLICY "講師は所属店舗のルートを閲覧可能" ON routes
  FOR SELECT USING (store_id IN (SELECT user_store_ids()));

CREATE POLICY "講師は所属店舗にルートを作成可能" ON routes
  FOR INSERT WITH CHECK (
    store_id IN (SELECT user_store_ids())
    AND owner_user_id = auth.uid()
  );

-- books: 自分のprivate + 全public
CREATE POLICY "教材閲覧" ON books
  FOR SELECT USING (
    visibility = 'public'
    OR organization_id IN (SELECT user_org_ids())
    OR creator_user_id = auth.uid()
  );

-- students: 所属店舗の生徒のみ
CREATE POLICY "講師は所属店舗の生徒を管理" ON students
  FOR ALL USING (store_id IN (SELECT user_store_ids()));
```

### 生徒（疑似認証）

- `/s` で store_code + student_code + PIN を検証
- サーバーサイドで `student_id` を含む署名付き httpOnly cookie を発行
- API Route (Server Action) で cookie を検証し、該当 student_id のデータのみ返す
- RLS は使わず、サーバーサイドで制御（service_role key）

---

## プラン制限チェック（サーバーサイド）

```typescript
// lib/plan-limits.ts
const PLAN_LIMITS = {
  free:  { stores: 0, teachers: 0,  students: 0,  resourcesPerBook: 0  },
  pro:   { stores: 1, teachers: 3,  students: 50, resourcesPerBook: 3  },
  team:  { stores: 1, teachers: -1, students: -1, resourcesPerBook: -1 },
  // team の stores は 1 + subscriptions.extra_stores
  // -1 = 無制限
} as const;
```
