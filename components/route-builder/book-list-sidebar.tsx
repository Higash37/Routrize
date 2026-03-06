"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, BookOpen } from "lucide-react";
import { shortDate } from "@/lib/date-utils";
import type { RouteItemState } from "@/types/route-builder";
import type { MockBook } from "@/types/route-builder";
import { BookPickerModal } from "./book-picker-modal";

type BookListSidebarProps = {
  items: RouteItemState[];
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onRemoveItem: (id: string) => void;
  onAddBook: (book: MockBook) => void;
};

export function BookListSidebar({
  items,
  selectedItemId,
  onSelectItem,
  onRemoveItem,
  onAddBook,
}: BookListSidebarProps) {
  return (
    <div className="flex w-72 shrink-0 flex-col border-r bg-white">
      {/* 3段ヘッダー */}
      <div className="shrink-0 border-b bg-[#1F3864]">
        <div className="flex h-8 items-center px-3">
          <span className="text-sm font-semibold text-white">教材</span>
        </div>
        <div className="flex h-8 items-center justify-between border-b border-[#2B5797]/60 px-3">
          <span className="text-sm text-white/50">{items.length}冊</span>
          <BookPickerModal
            existingBookIds={items.map((i) => i.bookId)}
            onAdd={onAddBook}
          />
        </div>
        <div className="h-6" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <BookOpen className="mb-4 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
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
                "group flex h-14 items-center gap-2.5 border-b border-border/30 px-3 cursor-pointer transition-colors",
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
                  className="h-12 w-9 shrink-0 rounded-sm border object-cover"
                />
              ) : (
                <div className="flex h-12 w-9 shrink-0 items-center justify-center rounded-sm bg-slate-200 text-xs font-bold text-slate-500">
                  {item.title.slice(0, 1)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-medium leading-tight">
                  {item.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {shortDate(item.startDate)}〜{shortDate(item.endDate)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveItem(item.id);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
