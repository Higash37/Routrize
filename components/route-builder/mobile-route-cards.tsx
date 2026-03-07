"use client";

import { BookOpen, Calendar, Plus, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shortDate } from "@/lib/date-utils";
import type { RouteItemState } from "@/types/route-builder";
import type { RegisteredBook } from "@/types/book";
import { BookPickerModal } from "./book-picker-modal";

type MobileRouteCardsProps = {
  items: RouteItemState[];
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onRemoveItem: (id: string) => void;
  onAddBook: (book: RegisteredBook) => void;
};

export function MobileRouteCards({
  items,
  selectedItemId,
  onSelectItem,
  onRemoveItem,
  onAddBook,
}: MobileRouteCardsProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          教材を追加してカリキュラムを作成しましょう
        </p>
        <div className="mt-4">
          <BookPickerModal existingBookIds={[]} onAdd={onAddBook} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* 追加ボタンヘッダー */}
      <div className="flex items-center justify-between border-b bg-[#1F3864] px-4 py-2">
        <span className="text-sm font-medium text-white">
          教材 {items.length}冊
        </span>
        <BookPickerModal
          existingBookIds={items.map((i) => i.bookId)}
          onAdd={onAddBook}
        />
      </div>

      {/* カードリスト */}
      <div className="space-y-2 p-3">
        {items.map((item) => {
          const isSelected = item.id === selectedItemId;
          const daysTotal = Math.round(
            (new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) /
              (1000 * 60 * 60 * 24),
          );

          return (
            <div
              key={item.id}
              className={`rounded-lg border bg-white shadow-sm transition-all ${
                isSelected ? "ring-2 ring-[#4472C4]" : ""
              }`}
            >
              <button
                type="button"
                className="flex w-full items-center gap-3 p-3 text-left"
                onClick={() => onSelectItem(isSelected ? null : item.id)}
              >
                {/* 色バー */}
                <div
                  className="h-12 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />

                {/* 表紙 */}
                {item.coverImageUrl ? (
                  <img
                    src={item.coverImageUrl}
                    alt=""
                    className="h-12 w-9 shrink-0 rounded-sm border object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-9 shrink-0 items-center justify-center rounded-sm bg-slate-200 text-xs font-bold text-slate-500">
                    {item.title.slice(0, 1)}
                  </div>
                )}

                {/* 情報 */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {shortDate(item.startDate)}〜{shortDate(item.endDate)}
                    </span>
                    <span>{daysTotal}日間</span>
                  </div>
                  {item.subject && (
                    <span
                      className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.subject}
                    </span>
                  )}
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>

              {/* 削除ボタン（選択時） */}
              {isSelected && (
                <div className="border-t px-3 py-2">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <X className="h-3 w-3" />
                    この教材を削除
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
