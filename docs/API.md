# API / 操作一覧

フロントエンドから見た操作の定義。Supabase Client を直接使用（REST APIラッパーは不要）。

---

## ルート操作

| 操作 | Supabase呼び出し | 備考 |
|---|---|---|
| ルート作成 | `supabase.from('routes').insert(...)` | ログイン後のみ |
| ルート取得 | `supabase.from('routes').select('*, route_items(*, route_notes(*), books(*))').eq('id', routeId)` | items + notes を一括取得 |
| ルート一覧 | `supabase.from('routes').select('*').eq('store_id', storeId)` | 校舎フィルタ |
| ルート更新 | `supabase.from('routes').update(...).eq('id', routeId)` | title, duration_weeks等 |
| ルート複製 | RPC or クライアント側で items + notes を含めて再INSERT | |
| ルート削除 | `supabase.from('routes').delete().eq('id', routeId)` | CASCADE で items, notes も削除 |

### route_items

| 操作 | 呼び出し |
|---|---|
| 追加 | `supabase.from('route_items').insert(...)` |
| 更新 | `supabase.from('route_items').update({ start_week, weeks, sort_index }).eq('id', itemId)` |
| 削除 | `supabase.from('route_items').delete().eq('id', itemId)` |

### route_notes

| 操作 | 呼び出し |
|---|---|
| 追加 | `supabase.from('route_notes').insert(...)` |
| 更新 | `supabase.from('route_notes').update({ text, week }).eq('id', noteId)` |
| 削除 | `supabase.from('route_notes').delete().eq('id', noteId)` |

---

## 生徒管理

| 操作 | 呼び出し | 備考 |
|---|---|---|
| 生徒作成 | `supabase.from('students').insert(...)` | student_code 生成、PIN は bcrypt hash |
| 生徒一覧 | `supabase.from('students').select('*').eq('store_id', storeId)` | ページング |
| 生徒更新 | `supabase.from('students').update(...).eq('id', studentId)` | |
| PIN再発行 | update pin_hash | 新PINを表示 → hash保存 |
| 生徒削除 | `supabase.from('students').delete().eq('id', studentId)` | |

### student_routes（割当）

| 操作 | 呼び出し |
|---|---|
| 割当 | `supabase.from('student_routes').insert({ student_id, route_id })` |
| 割当解除 | `supabase.from('student_routes').delete().eq('id', id)` |

---

## 学習ログ

| 操作 | 呼び出し | ユーザー |
|---|---|---|
| ログ作成 | `supabase.from('study_logs').insert(...)` | 生徒 |
| ログ一覧（生徒） | `supabase.from('study_logs').select('*, books(title)').eq('student_id', studentId).order('date', { ascending: false })` | 生徒/講師 |
| ログ集計（講師） | `supabase.rpc('get_weekly_study_summary', { store_id })` | 講師 |

---

## 参考書（books）

| 操作 | 呼び出し | 備考 |
|---|---|---|
| 検索 | `supabase.from('books').select('*').ilike('title', `%${query}%`)` | ゲストも利用可能 |
| 一覧 | `supabase.from('books').select('*').eq('subject', subject)` | 教科フィルタ |

---

## TanStack Query キー設計

```typescript
const queryKeys = {
  routes: {
    all: ['routes'] as const,
    list: (storeId: string) => ['routes', 'list', storeId] as const,
    detail: (routeId: string) => ['routes', 'detail', routeId] as const,
  },
  students: {
    all: ['students'] as const,
    list: (storeId: string, page: number) => ['students', 'list', storeId, page] as const,
    detail: (studentId: string) => ['students', 'detail', studentId] as const,
  },
  studyLogs: {
    all: ['study-logs'] as const,
    list: (studentId: string) => ['study-logs', 'list', studentId] as const,
    weekly: (storeId: string) => ['study-logs', 'weekly', storeId] as const,
  },
  books: {
    all: ['books'] as const,
    search: (query: string) => ['books', 'search', query] as const,
  },
} as const;
```

---

## ゲスト操作（LocalStorage）

ゲストはSupabaseを使わず、LocalStorageに保存。

```typescript
const GUEST_ROUTE_KEY = 'routrize:guest-route';

// 保存（debounce 500ms）
localStorage.setItem(GUEST_ROUTE_KEY, JSON.stringify(routeState));

// 読み込み
const saved = localStorage.getItem(GUEST_ROUTE_KEY);
if (saved) dispatch({ type: 'LOAD_ROUTE', state: JSON.parse(saved) });

// ログイン後にクリア
localStorage.removeItem(GUEST_ROUTE_KEY);
```
