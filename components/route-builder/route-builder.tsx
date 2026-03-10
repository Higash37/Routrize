"use client";

import { useReducer, useCallback, useEffect, useMemo, useState } from "react";
import { routeReducer, INITIAL_ROUTE_STATE } from "@/lib/route-reducer";
import { useLocalStorageRoute } from "@/hooks/use-local-storage-route";
import { useDbRoute } from "@/hooks/use-db-route";
import { useAuth } from "@/hooks/use-auth";
import { addMonths, getRouteDateRange, toISODate } from "@/lib/date-utils";
import { SUBJECT_DEFAULT_COLORS, DEFAULT_ITEM_COLOR } from "@/lib/constants";
import type { RegisteredBook } from "@/types/book";
import type { RouteState } from "@/types/route-builder";
import { RouteHeader } from "./route-header";
import { BookListSidebar } from "./book-list-sidebar";
import { RouteGantt } from "./route-gantt";
import { ItemSettingsPanel } from "./item-settings-panel";
import { MobileRouteCards } from "./mobile-route-cards";
import { NavSidebar } from "@/components/shared/nav-sidebar";
import { RouteDetailPage } from "./route-detail-page";
import { BookPickerModal } from "./book-picker-modal";

const SESSION_CACHE_KEY = "routrize:session-cache";

// SPA内ナビゲーション用のメモリキャッシュ
let memoryCache: { state: RouteState; dbId?: string } | null = null;

/** リロード時はlocalStorageから復元、ナビゲーション時はメモリから復元 */
function getInitialState(): { state: RouteState; dbId?: string; fromCache: boolean } {
  // メモリキャッシュ（ナビゲーション復帰）
  if (memoryCache) return { ...memoryCache, fromCache: true };
  // localStorageキャッシュ（リロード復帰）
  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.items) return { state: parsed.state, dbId: parsed.dbId, fromCache: true };
    }
  } catch {}
  return { state: INITIAL_ROUTE_STATE, dbId: undefined, fromCache: false };
}

export function RouteBuilder() {
  const [initial] = useState(getInitialState);
  const [state, dispatch] = useReducer(routeReducer, initial.state);
  const [navOpen, setNavOpen] = useState(false);
  const [dbId, setDbId] = useState<string | undefined>(initial.dbId);
  const [bookPickerOpen, setBookPickerOpen] = useState(false);
  const { isLoggedIn } = useAuth();

  // state 変更のたびにメモリキャッシュ + localStorage に即時保存
  useEffect(() => {
    memoryCache = { state, dbId };
    try { localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ state, dbId })); } catch {}
  }, [state, dbId]);

  // ゲスト: localStorage(guest-route)、ログイン: DB
  // キャッシュ復帰時はDB/localStorageからの初回ロードをスキップ
  useLocalStorageRoute(state, dispatch, initial.fromCache);
  const dbRouteState = useMemo(() => ({ ...state, dbId }), [state, dbId]);
  useDbRoute(dbRouteState, dispatch, setDbId, initial.fromCache);

  const selectedItem =
    state.items.find((i) => i.id === state.selectedItemId) ?? null;

  const { routeEnd } = useMemo(
    () => getRouteDateRange(state.startDate, state.months),
    [state.startDate, state.months],
  );

  const handleAddBook = useCallback(
    (book: RegisteredBook) => {
      const start = state.startDate;
      const end = addMonths(start, 3);

      dispatch({
        type: "ADD_ITEM",
        item: {
          id: crypto.randomUUID(),
          bookId: book.id,
          title: book.title,
          subject: book.subject,
          fields: [],
          color: SUBJECT_DEFAULT_COLORS[book.subject] ?? DEFAULT_ITEM_COLOR,
          targetGrade: "",
          tags: [],
          difficulty: 3,
          importance: 3,
          memo: "",
          totalPages: 0,
          chapters: [],
          targetRounds: 1,
          subtasks: [],
          coverImageUrl: book.coverImageUrl,
          sortIndex: 0,
          startDate: start,
          endDate: end,
        },
      });
    },
    [state.startDate],
  );

  const handleRemoveItem = useCallback((itemId: string) => {
    dispatch({ type: "REMOVE_ITEM", itemId });
  }, []);

  const handleSelectItem = useCallback((itemId: string | null) => {
    dispatch({ type: "SELECT_ITEM", itemId });
  }, []);

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <NavSidebar isOpen={navOpen} onClose={() => setNavOpen(false)} />
      <BookPickerModal
        existingBookIds={state.items.map((i) => i.bookId)}
        onAdd={handleAddBook}
        open={bookPickerOpen}
        onOpenChange={setBookPickerOpen}
      />
      <div data-print-hide>
        <RouteHeader
          title={state.title}
          startDate={state.startDate}
          months={state.months}
          onTitleChange={(title) => dispatch({ type: "SET_TITLE", title })}
          onStartDateChange={(date) => dispatch({ type: "SET_START_DATE", date })}
          onMonthsChange={(months) => dispatch({ type: "SET_MONTHS", months })}
          onMenuOpen={() => setNavOpen(true)}
        />
      </div>

      {/* PC: サイドバー + ガント + 設定パネル */}
      <div className="hidden md:flex flex-1 overflow-hidden" data-print-desktop>
        <div data-print-hide className="flex shrink-0">
          <BookListSidebar
            items={state.items}
            selectedItemId={state.selectedItemId}
            onSelectItem={handleSelectItem}
            onRemoveItem={handleRemoveItem}
            onAddBook={handleAddBook}
          />
        </div>

        <RouteGantt
          items={state.items}
          startDate={state.startDate}
          months={state.months}
          selectedItemId={state.selectedItemId}
          onSelectItem={handleSelectItem}
          onAddClick={() => setBookPickerOpen(true)}
        />

        {selectedItem && (
          <div data-print-hide className="flex shrink-0">
            <ItemSettingsPanel
              item={selectedItem}
              routeStartDate={state.startDate}
              routeEndDate={toISODate(routeEnd)}
              onUpdate={(changes) =>
                dispatch({
                  type: "UPDATE_ITEM",
                  itemId: selectedItem.id,
                  changes,
                })
              }
              onClose={() => handleSelectItem(null)}
            />
          </div>
        )}
      </div>

      {/* 印刷裏面: 教材詳細カード */}
      <RouteDetailPage items={state.items} title={state.title} />

      {/* モバイル: カードリスト + 設定パネル（フルスクリーン） */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden" data-print-mobile-hide>
        {selectedItem ? (
          <div className="flex-1 overflow-y-auto">
            <ItemSettingsPanel
              item={selectedItem}
              routeStartDate={state.startDate}
              routeEndDate={toISODate(routeEnd)}
              onUpdate={(changes) =>
                dispatch({
                  type: "UPDATE_ITEM",
                  itemId: selectedItem.id,
                  changes,
                })
              }
              onClose={() => handleSelectItem(null)}
            />
          </div>
        ) : (
          <MobileRouteCards
            items={state.items}
            selectedItemId={state.selectedItemId}
            onSelectItem={handleSelectItem}
            onRemoveItem={handleRemoveItem}
            onAddBook={handleAddBook}
          />
        )}
      </div>
    </div>
  );
}
