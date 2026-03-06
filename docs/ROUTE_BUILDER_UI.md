# Route Builder UI仕様

## 概要

ルートビルダーはRoutrizeの中核画面。参考書を追加し、期間をガント形式で設定する。
ゲスト（`/`）とログイン版（`/app/routes/:id`）で共通コンポーネントを使い、機能フラグで差異を管理。

---

## UI構成

```
┌──────────────────────────────────────────────┐
│ Header: ルート名 | [PDF] [保存] [ログイン]    │
├──────────┬───────────────────────────────────┤
│ 教材リスト │         ガントチャート             │
│ (左固定)  │     W1  W2  W3  ... W12          │
│          │ ┌──────────────┐                  │
│ [表紙]   │ │████████████ │ ← バー           │
│ 書名     │ └──────────────┘                  │
│          │     ┌────────────┐                │
│ [表紙]   │     │████████  │                  │
│ 書名     │     └────────────┘                │
│          │                                   │
│ [+追加]   │                                   │
├──────────┴──────────┬────────────────────────┤
│                     │ NotePanel（右サイド）   │
│                     │ 選択教材の吹き出し編集  │
└─────────────────────┴────────────────────────┘
```

---

## コンポーネント分解

```
RouteBuilder (components/route-builder/)
├── route-builder.tsx         # メインコンテナ
├── route-header.tsx          # ヘッダー（タイトル、PDF、保存、ログイン）
├── gantt-chart.tsx           # ガントチャートエリア
│   ├── gantt-header.tsx      # 週ヘッダー（W1〜W12）
│   ├── gantt-row.tsx         # 教材1行（左:書名、右:バー）
│   └── gantt-bar.tsx         # バー（ドラッグで開始週/期間変更）
├── book-list.tsx             # 左固定の教材リスト
├── book-search-modal.tsx     # 参考書検索モーダル
└── note-panel.tsx            # 右サイドパネル（吹き出し編集）
```

---

## 状態管理

### useReducer アクション定義

```typescript
type RouteState = {
  title: string;
  durationWeeks: number;
  items: RouteItemState[];
  selectedItemId: string | null;
};

type RouteItemState = {
  id: string;          // 一時ID（ゲスト時はcrypto.randomUUID()）
  bookId: string;
  bookTitle: string;
  coverImageUrl: string | null;
  sortIndex: number;
  startWeek: number;
  weeks: number;
  notes: NoteState[];
};

type NoteState = {
  id: string;
  type: "caution" | "turning";
  week: number;
  text: string;
};

type RouteAction =
  | { type: "SET_TITLE"; title: string }
  | { type: "SET_DURATION"; weeks: number }
  | { type: "ADD_ITEM"; item: RouteItemState }
  | { type: "REMOVE_ITEM"; itemId: string }
  | { type: "UPDATE_ITEM"; itemId: string; changes: Partial<RouteItemState> }
  | { type: "REORDER_ITEMS"; itemIds: string[] }
  | { type: "SELECT_ITEM"; itemId: string | null }
  | { type: "ADD_NOTE"; itemId: string; note: NoteState }
  | { type: "REMOVE_NOTE"; itemId: string; noteId: string }
  | { type: "UPDATE_NOTE"; itemId: string; noteId: string; changes: Partial<NoteState> }
  | { type: "LOAD_ROUTE"; state: RouteState };
```

### ゲスト → ログイン 状態移行フロー

```
1. ゲストがルートを作成
   → useReducer で状態管理
   → LocalStorage に自動保存（debounce 500ms）

2. 「保存」ボタン押下
   → ログインモーダル表示

3. ログイン成功
   → LocalStorage の RouteState を読み込み
   → Supabase に routes + route_items + route_notes を一括INSERT
   → LocalStorage をクリア
   → /app/routes/:newId にリダイレクト
```

---

## ゲスト版 vs ログイン版の差分

| 機能 | ゲスト | ログイン |
|---|---|---|
| ルート作成/編集 | OK | OK |
| ガント表示 | OK | OK |
| PDF（A4） | TRIAL透かし | 透かしなし |
| PDF（A3） | 不可 | OK |
| クラウド保存 | 不可（LocalStorage） | 自動/手動保存 |
| テンプレ化 | 不可 | OK |
| 生徒割当 | 不可 | OK |
| 吹き出し | OK | OK |

---

## UI設計の決め

- **最初に出す画面はRoute Builder固定**（ゲストOK）
- 追加は「+参考書追加（検索）」が最短。ドラッグ追加はv1.1以降
- ガントは週表示12週をデフォルト（印刷崩れ防止＆軽量）
- 左ペインに「表紙画像＋参考書名」を必ず置く
- 吹き出しは最大2個/教材（ゴチャつき防止）
