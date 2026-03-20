"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, BookOpen, Plus } from "lucide-react";
import { shortDate } from "@/lib/date-utils";
import type { RouteItemState } from "@/types/route-builder";
import type { RegisteredBook } from "@/types/book";
import { BookPickerModal } from "./book-picker-modal";

type BookListSidebarProps = {
  items: RouteItemState[];
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onRemoveItem: (id: string) => void;
  onAddBook: (book: RegisteredBook) => void;
};

export function BookListSidebar({
  items,
  selectedItemId,
  onSelectItem,
  onRemoveItem,
  onAddBook,
}: BookListSidebarProps) {
  return (
    <div className="flex w-36 shrink-0 flex-col border-r bg-white">
      {/* ヘッダー（ガント側と高さ揃え） */}
      <div className="shrink-0 border-b bg-[#1F3864]">
        <div className="flex h-5 items-center border-b border-[#2B5797] bg-white px-1.5">
          <span className="text-[10px] font-bold text-[#1F3864]">教材一覧</span>
        </div>
        <div className="flex h-6 items-center px-1.5">
          <span className="text-[10px] font-semibold text-white">{items.length}冊</span>
        </div>
        <div className="flex h-5 items-center justify-between border-b border-[#2B5797]/60 px-1.5">
          <BookPickerModal
            existingBookIds={items.map((i) => i.bookId)}
            onAdd={onAddBook}
          />
        </div>
        <div className="h-4" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-2 py-6 text-center">
            <BookOpen className="mb-2 h-5 w-5 text-muted-foreground/30" />
            <p className="text-[9px] text-muted-foreground">
              「+参考書追加」から
              <br />
              教材を追加してください
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "group flex h-7 items-center gap-1.5 border-b border-border/30 px-1.5 cursor-pointer transition-colors",
                item.id === selectedItemId
                  ? "bg-blue-50 border-l-[3px] border-l-[#4472C4]"
                  : "hover:bg-slate-50 border-l-[3px] border-l-transparent",
              )}
              onClick={() =>
                onSelectItem(item.id === selectedItemId ? null : item.id)
              }
            >
              {/* 表紙画像 or プレースホルダー */}
              {item.coverImageUrl ? (
                <img
                  src={item.coverImageUrl}
                  alt=""
                  className="h-6 w-4 shrink-0 rounded-sm border object-cover"
                />
              ) : (
                <div className="flex h-6 w-4 shrink-0 items-center justify-center rounded-sm bg-slate-200 text-[7px] font-bold text-slate-500">
                  {item.title.slice(0, 1)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[8px] font-medium leading-tight">
                  {item.title}
                </p>
                <p className="text-[7px] text-muted-foreground">
                  {shortDate(item.startDate)}〜{shortDate(item.endDate)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveItem(item.id);
                }}
              >
                <X className="h-2.5 w-2.5" />
              </Button>
            </div>
          ))
        )}
        {/* 追加行 */}
        <div data-print-hide>
          <BookPickerModal
            existingBookIds={items.map((i) => i.bookId)}
            onAdd={onAddBook}
            trigger={
              <button
                type="button"
                className="flex h-6 w-full items-center justify-center gap-0.5 border-b border-dashed border-border/30 text-[8px] text-muted-foreground hover:bg-slate-50 hover:text-[#4472C4] transition-colors"
              >
                <Plus className="h-2.5 w-2.5" />
                教材を追加
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
}
