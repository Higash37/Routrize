-- 006: RLS policies

-- ヘルパー関数
CREATE OR REPLACE FUNCTION user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT DISTINCT organization_id FROM memberships WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_store_ids()
RETURNS SETOF UUID AS $$
  SELECT store_id FROM memberships WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── organizations ──
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所属組織を閲覧可能" ON organizations
  FOR SELECT USING (id IN (SELECT user_org_ids()));

-- ── subscriptions ──
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所属組織のサブスクを閲覧可能" ON subscriptions
  FOR SELECT USING (organization_id IN (SELECT user_org_ids()));

-- ── stores ──
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所属店舗を閲覧可能" ON stores
  FOR SELECT USING (id IN (SELECT user_store_ids()));

CREATE POLICY "所属組織に店舗を作成可能" ON stores
  FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));

-- ── memberships ──
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の所属を閲覧可能" ON memberships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "同じ組織のメンバーを閲覧可能" ON memberships
  FOR SELECT USING (organization_id IN (SELECT user_org_ids()));

-- ── books ──
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "公開教材は誰でも閲覧可能" ON books
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "自分の組織の教材を閲覧可能" ON books
  FOR SELECT USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY "自分が作成した教材を閲覧可能" ON books
  FOR SELECT USING (creator_user_id = auth.uid());

CREATE POLICY "ログインユーザーは教材を作成可能" ON books
  FOR INSERT WITH CHECK (creator_user_id = auth.uid());

CREATE POLICY "自分の教材を更新可能" ON books
  FOR UPDATE USING (creator_user_id = auth.uid());

-- ── book_chapters ──
ALTER TABLE book_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "教材が見える場合チャプターも閲覧可能" ON book_chapters
  FOR SELECT USING (book_id IN (SELECT id FROM books));

CREATE POLICY "自分の教材のチャプターを管理可能" ON book_chapters
  FOR ALL USING (book_id IN (SELECT id FROM books WHERE creator_user_id = auth.uid()));

-- ── book_sections ──
ALTER TABLE book_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "チャプターが見える場合セクションも閲覧可能" ON book_sections
  FOR SELECT USING (chapter_id IN (SELECT id FROM book_chapters));

CREATE POLICY "自分の教材のセクションを管理可能" ON book_sections
  FOR ALL USING (
    chapter_id IN (
      SELECT bc.id FROM book_chapters bc
      JOIN books b ON b.id = bc.book_id
      WHERE b.creator_user_id = auth.uid()
    )
  );

-- ── book_resources ──
ALTER TABLE book_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "教材が見える場合リソースも閲覧可能" ON book_resources
  FOR SELECT USING (book_id IN (SELECT id FROM books));

CREATE POLICY "自分の教材のリソースを管理可能" ON book_resources
  FOR ALL USING (book_id IN (SELECT id FROM books WHERE creator_user_id = auth.uid()));

-- ── org_book_library ──
ALTER TABLE org_book_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所属組織のライブラリを閲覧可能" ON org_book_library
  FOR SELECT USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY "所属組織のライブラリに追加可能" ON org_book_library
  FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));

-- ── routes ──
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所属店舗のルートを閲覧可能" ON routes
  FOR SELECT USING (store_id IN (SELECT user_store_ids()));

CREATE POLICY "所属店舗にルートを作成可能" ON routes
  FOR INSERT WITH CHECK (
    store_id IN (SELECT user_store_ids())
    AND owner_user_id = auth.uid()
  );

CREATE POLICY "自分のルートを更新可能" ON routes
  FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY "自分のルートを削除可能" ON routes
  FOR DELETE USING (owner_user_id = auth.uid());

-- ── route_items ──
ALTER TABLE route_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ルートが見える場合アイテムも閲覧可能" ON route_items
  FOR SELECT USING (route_id IN (SELECT id FROM routes));

CREATE POLICY "自分のルートのアイテムを管理可能" ON route_items
  FOR ALL USING (route_id IN (SELECT id FROM routes WHERE owner_user_id = auth.uid()));

-- ── route_subtasks ──
ALTER TABLE route_subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "アイテムが見える場合サブタスクも閲覧可能" ON route_subtasks
  FOR SELECT USING (route_item_id IN (SELECT id FROM route_items));

CREATE POLICY "自分のルートのサブタスクを管理可能" ON route_subtasks
  FOR ALL USING (
    route_item_id IN (
      SELECT ri.id FROM route_items ri
      JOIN routes r ON r.id = ri.route_id
      WHERE r.owner_user_id = auth.uid()
    )
  );

-- ── students ──
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所属店舗の生徒を管理可能" ON students
  FOR ALL USING (store_id IN (SELECT user_store_ids()));

-- ── student_routes ──
ALTER TABLE student_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所属店舗の割当を管理可能" ON student_routes
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE store_id IN (SELECT user_store_ids())
    )
  );

-- ── study_logs ──
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所属店舗の学習ログを閲覧可能" ON study_logs
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE store_id IN (SELECT user_store_ids())
    )
  );
