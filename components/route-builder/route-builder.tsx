"use client";

import { useReducer, useCallback, useMemo, useState } from "react";
import { routeReducer, INITIAL_ROUTE_STATE } from "@/lib/route-reducer";
import { useLocalStorageRoute } from "@/hooks/use-local-storage-route";
import { addMonths, getRouteDateRange, toISODate } from "@/lib/date-utils";
import { SUBJECT_DEFAULT_COLORS, DEFAULT_ITEM_COLOR } from "@/lib/constants";
import type { RegisteredBook } from "@/types/book";
import { RouteHeader } from "./route-header";
import { BookListSidebar } from "./book-list-sidebar";
import { RouteGantt } from "./route-gantt";
import { ItemSettingsPanel } from "./item-settings-panel";
import { NavSidebar } from "@/components/shared/nav-sidebar";

export function RouteBuilder() {
  const [state, dispatch] = useReducer(routeReducer, INITIAL_ROUTE_STATE);
  const [navOpen, setNavOpen] = useState(false);
  useLocalStorageRoute(state, dispatch);

  const selectedItem =
    state.items.find((i) => i.id === state.selectedItemId) ?? null;

  const { routeEnd } = useMemo(
    () => getRouteDateRange(state.startDate, state.months),
    [state.startDate, state.months],
  );

  const handleAddBook = useCallback(
    (book: RegisteredBook) => {
      // デフォルト：開始月の1日〜3ヶ月後
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

      <div className="flex flex-1 overflow-hidden">
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
    </div>
  );
}
