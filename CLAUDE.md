# Routrize

塾講師が参考書ルート（カリキュラム）を高速に作成し、PDF出力・生徒配布・進捗管理までできるB2B SaaS。

## 技術スタック

- **Framework**: Next.js 16 (App Router) / React 19 / TypeScript 5 (strict)
- **UI**: shadcn/ui + Tailwind CSS 4 + lucide-react
- **Form**: react-hook-form + zod + @hookform/resolvers
- **Data Fetching**: TanStack Query (React Query)
- **DB / Auth**: Supabase (PostgreSQL + Auth + RLS)
- **State**: useReducer（ルート編集）/ LocalStorage（ゲスト）/ TanStack Query（サーバーデータ）

## ディレクトリ構成

```
app/(guest)/          → / ゲスト用Route Builder
app/app/              → /app/* 講師用（認証必須）
app/s/                → /s 生徒ポータル
components/ui/        → shadcn/ui（自動生成、手で編集しない）
components/{feature}/ → 機能別コンポーネント
lib/supabase/         → Supabaseクライアント
lib/validations/      → zodスキーマ
hooks/                → カスタムフック
types/                → 型定義
docs/                 → 設計ドキュメント
```

## コーディング規約

### TypeScript
- `strict: true`。`any` 禁止。`unknown` + 型ガードを使う
- 型は `types/` に集約。コンポーネントのPropsはコンポーネントファイル内で定義OK

### コンポーネント
- 関数コンポーネント + **named export**（`export function Foo()`）
- `export default` はページ（`page.tsx`）と レイアウト（`layout.tsx`）のみ
- コンポーネントファイルはPascalCaseではなく kebab-case（例: `route-builder.tsx`）

### 命名
- コンポーネント名: PascalCase（`RouteBuilder`）
- フック: camelCase + `use` prefix（`useRouteEditor`）
- 型/interface: PascalCase（`RouteItem`, `StudyLog`）
- 定数: UPPER_SNAKE_CASE（`DEFAULT_DURATION_WEEKS`）
- ファイル名: kebab-case（`route-builder.tsx`, `use-route-editor.ts`）

### import
- `@/` エイリアスを使用（`import { cn } from "@/lib/utils"`）
- 相対パスは同一ディレクトリ内のみ許可

### 状態管理
- サーバーデータ → TanStack Query（キャッシュ + refetch）
- ルート編集（ガント）の一時状態 → useReducer
- ゲスト状態 → LocalStorage（ログイン後にDBへ移行）
- グローバルUI状態（モーダル等）→ 必要になったら Zustand

### フォーム
- react-hook-form + zod
- zodスキーマは `lib/validations/` に配置
- `@hookform/resolvers/zod` で接続

### スタイル
- Tailwind utility classes を使用
- インラインstyle禁止
- カスタムCSS は `globals.css` の変数定義のみ
- shadcn/ui コンポーネントは `components/ui/` に配置（npx shadcn addで追加）

### エラーハンドリング
- try-catch は外部API（Supabase等）呼び出し時のみ
- 内部ロジックでは型で担保

### コメント
- 日本語OK
- 自明なコードにはコメント不要
- WHY（なぜ）を書く。WHAT（何を）は書かない

## デザインルール

- **テーマ**: ライトのみ（白背景 + 青アクセント #3b82f6）
- **デザイン参考**: 小テストジェネレーター（printgenerator.net）のシンプルで即使えるUI
- **初回画面**: Route Builder直表示（ゲストOK）
- **ステップ最小化**: 追加→設定→完了の3ステップ以内
- **印刷意識**: A4/A3のレイアウトを崩さない設計
- **レスポンシブ**: 生徒ポータル（/s）はモバイル対応。講師画面はデスクトップ前提

## コミット規約

- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
- 日本語メッセージ可（例: `feat: ルートビルダーのガント表示を実装`）

## 開発コマンド

```bash
npm run dev     # 開発サーバー起動
npm run build   # プロダクションビルド
npm run lint    # ESLint実行
```

## 設計ドキュメント

詳細は `docs/` を参照:
- `docs/PRD.md` — プロダクト要件
- `docs/MVP_SPEC.md` — MVP画面仕様
- `docs/DB_SCHEMA.md` — データベース設計
- `docs/ROUTE_BUILDER_UI.md` — ルートビルダーUI仕様
- `docs/API.md` — API/操作一覧
