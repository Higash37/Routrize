以下、**Claudeがそのまま理解して実装に落とせるレベル**のMVP設計書です（B2B前提・ただし最初はゲストで即作成できる導線）。

---

## 0. プロダクト要約

**目的**：塾講師が「参考書ルート（カリキュラム）」を高速に作成し、（ログイン後に）保存・PDF出力・生徒配布・進捗ログ収集までできるB2B SaaS。
**MVPの勝ち筋**：「開いた瞬間にルートを作れる」→「ログインで保存と配布が解放」→「校舎運用が回る」。

---

## 1. MVPの範囲

### 1.1 MVPで実現すること（Must）

**A. ゲスト（ログイン不要）**

- ルート作成（参考書を追加・期間設定・ガント表示）
- A4 PDFプレビュー/出力（透かし `TRIAL` ありで可）
- 「保存」押下でログイン誘導（=ログイン後にクラウド保存）

**B. ログイン後（講師）**

- ルートのクラウド保存/複製
- A4/A3 PDF出力（透かしなし）
- 生徒の作成（個人情報なし：店舗コード＋生徒ID＋PIN）
- ルートを生徒へ割当
- 生徒の学習ログ（日次：時間/教材/理解度）を収集
- 講師ダッシュボード（未入力・今週学習時間集計）

**C. 組織（サブスクはMVPでは“フラグ”だけでもOK）**

- 組織 → 店舗（校舎） → 講師の所属
- 店舗内共有（講師が作ったルートを校舎で見られる）

### 1.2 MVPでやらないこと（Non-goals）

- AI推奨/自動ルート生成
- チャット、プッシュ通知、メール通知
- SNS共有、マーケット（出版社連携）
- 高度な相関分析/因果推定
- ネイティブアプリ（PWAでOK）

---

## 2. 体験設計（最重要導線）

### 2.1 初回アクセス導線（ゲスト）

**URL**：`/`

- Route Builder（ルート編集画面）が即表示
- ヘッダー右に `ログイン` と `保存` と `PDF`
  - ゲストで `保存` → ログインモーダル → ログイン成功後に `routes` 保存

### 2.2 ログイン後導線（B2B）

**URL**：`/app`

- 左ナビ：Dashboard / Routes / Students / Insights（InsightsはMVPでは軽い集計だけ）
- ルート編集は `/app/routes/:routeId`

### 2.3 生徒導線（別入口）

**URL**：`/s`（Student Portal）

- 店舗コード + 生徒ID + PIN でログイン
- 今日の入力（10秒）：学習時間（分）、教材（割当ルートから選択）、理解度（🙂😐🙁）、任意メモ
- 自分のログ履歴（リスト）

---

## 3. 画面仕様（MVP）

### 3.1 `/` Route Builder（ゲスト）

**目的**：最短でルート作成体験
**UI**：

- ヘッダー
  - ルート名（未保存なら “無題のルート”）
  - [PDF]（A4、TRIAL透かし）
  - [保存]（押下でログイン誘導）
  - [ログイン]

- 本体：ガント
  - 上：時間軸（週表示 W1〜W12 をデフォ）
  - 左固定：教材行（表紙サムネ + 書名）
  - 右：バー（開始週/週数で描画）

- 追加
  - `+参考書追加`（モーダル検索）
  - またはガントの空白ドラッグで期間→参考書選択でもOK（MVPはボタンだけでも可）

- 吹き出し（MVP）
  - 参考書行を選択 → 右サイドパネルで 💬注意 / ⭐ターニング を追加（各教材最大2つ）

### 3.2 `/app` Dashboard（講師）

**目的**：今日の運用が回る
表示：

- 未入力生徒（最終入力日）
- 今週学習時間（校舎平均、または合計）
- 進捗遅れ（MVPは「学習時間が少ない」など簡易判定でもOK）
  導線：
- Studentsへ
- Routesへ
- 直近ルート編集へ

### 3.3 `/app/routes` Routes一覧

- ルート一覧（校舎共有/自分のみフィルタ）
- 複製
- 新規作成（空/テンプレ）

### 3.4 `/app/routes/:id` Route Builder（ログイン版）

ゲスト版 + 以下解放

- 自動保存（または手動保存 + トースト）
- A4/A3 PDF（透かしなし）
- ルートをテンプレ化（校舎共有フラグ）
- 生徒への割当（Students選択）

### 3.5 `/app/students` 生徒一覧

テーブル（B2Bはカードより速い）

- 生徒コード
- 学年/学校/志望校/偏差値（任意項目）
- 今週学習時間
- 最終入力日
- 未入力日数
  クリックで詳細（右ドロワーでもOK）

### 3.6 `/app/students/:id` 生徒詳細

- 基本情報（学校/偏差値等）
- 割当ルート（名前 + ガント簡易 or 教材リスト）
- 学習ログ（リスト）
- PIN再発行

### 3.7 `/s` 生徒ポータル

- ログイン（店舗コード + 生徒ID + PIN）
- 今日の入力
  - 勉強時間（15分刻み）
  - 教材（割当ルートの教材から選択）
  - 理解度🙂😐🙁
  - 任意メモ

- 過去ログ（リスト）

---

## 4. データモデル（MVP）

Supabase想定。10テーブル以内。

### 4.1 テーブル一覧

1. `organizations`

- `id` (uuid)
- `name`
- `plan` (enum: free/pro/team) ※MVPは文字列でも
- `created_at`

2. `stores`（校舎）

- `id`
- `organization_id`
- `name`
- `store_code`（短いコード。生徒ログインに使用）
- `created_at`

3. `memberships`（講師所属）

- `id`
- `user_id`（auth.users）
- `store_id`
- `role` (enum: owner/admin/teacher)
- `created_at`

4. `books`（参考書マスタ）

- `id`
- `title`
- `subject`（英語/数学…）
- `cover_image_url`（CDN想定）
- `level`（基礎/標準/難関）
- `created_at`
  ※最初は手入力/seedでOK

5. `routes`

- `id`
- `store_id`（校舎共有の単位）
- `owner_user_id`
- `title`
- `duration_weeks`（12/16など）
- `is_template`（校舎テンプレ）
- `created_at`, `updated_at`

6. `route_items`（ガントの1行=参考書）

- `id`
- `route_id`
- `book_id`
- `sort_index`
- `start_week`（1..duration）
- `weeks`（期間）
- `created_at`, `updated_at`

7. `route_notes`（吹き出し）

- `id`
- `route_item_id`
- `type` (enum: caution/turning)
- `week`（何週目に表示）
- `text`
- `y_offset`（印刷/重なり回避用。MVPはnullでOK）
- `created_at`

8. `students`

- `id`
- `store_id`
- `student_code`（店舗内一意。例 SJK-0421）
- `pin_hash`（PINは必ずハッシュ）
- `grade`（任意）
- `school_name`（任意）
- `target_school`（任意）
- `current_deviation`（偏差値: number, 任意）
- `created_at`, `updated_at`

9. `student_routes`（割当）

- `id`
- `student_id`
- `route_id`
- `start_date`（任意。MVPはnullでも）
- `created_at`

10. `study_logs`

- `id`
- `student_id`
- `date`（yyyy-mm-dd）
- `minutes`（int）
- `book_id`（その日やった教材）
- `understanding`（enum: good/ok/bad）
- `note`（任意）
- `created_at`

> **MVP最小**なら、`route_notes` と `student_routes` は後でも良いが、商談の見栄えと運用にはあると強い。

---

## 5. 権限（RLS方針）

### 5.1 講師（Supabase Auth）

- `memberships` により `store_id` が決まる
- 講師は自分の所属 `store_id` の以下のみ読み書き可能
  - `routes`, `route_items`, `route_notes`
  - `students`, `student_routes`
  - `study_logs`（閲覧）

### 5.2 生徒（匿名ログイン）

MVP実装案（簡易）：

- 生徒ログインは **Supabase Authを使わず**、`/s`で店舗コード+生徒ID+PINを検証し、成功したら短命のセッショントークン（httpOnly cookie）を発行する方式でもOK。
- `study_logs` はそのセッションが示す `student_id` のみ作成/閲覧可能。

より正攻法（後で）：

- 生徒もAuth化（ただしメール無しは工夫が必要）。

---

## 6. API/操作（フロントから見た要件）

### 6.1 ルート作成

- `POST /routes`（ログイン後）
- `POST /route_items`（追加）
- `PATCH /route_items/:id`（start_week/weeks/sort_index）
- `POST /route_notes`（吹き出し）
- ゲストはローカル状態（LocalStorage）で保持し、ログイン後にまとめて保存

### 6.2 生徒管理

- `POST /students`（student_code生成、PIN発行→hash保存）
- `POST /student_routes`（割当）
- `POST /study_logs`（生徒入力）
- `GET /study_logs?student_id=...`（講師/生徒）

---

## 7. PDF出力仕様（MVP）

- A4：チェックリスト（教材名、期間、チェック欄、吹き出し簡易）
- A3：ロードマップ（左：表紙+教材名、右：ガント、吹き出し、QR）
- ゲストはA4のみ `TRIAL` 透かし
- ログイン後はA4/A3透かしなし

---

## 8. パフォーマンス要件（B2B超高速）

- 初回 `/` は **Route Builderだけ**。重いダッシュボードデータは読まない
- `books` はキャッシュ（クライアントキャッシュ or edgeキャッシュ）
- Students一覧はページング
- ルート編集は optimistic update（保存待ちでUIを止めない）
- 画像は遅延読み込み（表紙は低解像から）

---

## 9. 開発マイルストーン（最短）

### Milestone 1：ゲストでルート作成（最重要）

- `/` Route Builder（追加・ガント表示）
- LocalStorage保存（ゲスト）
- A4 PDF（TRIAL）

### Milestone 2：ログインとクラウド保存

- Auth（講師）
- `/app/routes` 保存/一覧
- Route Builderの自動保存

### Milestone 3：生徒運用

- Students CRUD + PIN
- `/s` 生徒ログイン + 日次ログ
- Dashboardの未入力/今週集計

### Milestone 4：商談用の見栄え

- A3 PDF（表紙+ガント+吹き出し+QR）
- Insights（入力率、時間帯ヒートマップは“可視化のみ”）

---

## 10. UI設計の決め（Claude向け重要注記）

- **最初に出す画面はRoute Builder固定**（ゲストOK）
- 追加は「+参考書追加（検索）」が最短。ドラッグ追加はv1.1でも良い
- ガントは週表示12週をデフォ（印刷崩れ防止＆軽量）
- 左ペインに「表紙画像＋参考書名」を必ず置く（ユーザー要望）
- 吹き出しは最大2個/教材（ゴチャつき防止）

---

必要なら、この設計書をそのままClaudeに投げたうえで、次の追加資料も作れます（聞き返しなしで出せます）：

- 画面ごとのコンポーネント分解図（Reactのディレクトリ構成）
- Supabase RLSポリシーの具体例（SQL）
- Route Builderの状態管理設計（Zustand/Context/React Queryの使い分け）

どれを先に渡すと一番実装が速い？
