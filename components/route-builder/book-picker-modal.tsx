"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, BookOpen } from "lucide-react";
import { useBooks } from "@/hooks/use-books";
import type { RegisteredBook } from "@/types/book";

type BookPickerModalProps = {
  existingBookIds: string[];
  onAdd: (book: RegisteredBook) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function BookPickerModal({
  existingBookIds,
  onAdd,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: BookPickerModalProps) {
  const { books } = useBooks();
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => controlledOnOpenChange?.(v)
    : setInternalOpen;

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return books.filter(
      (b) =>
        !existingBookIds.includes(b.id) &&
        (b.title.toLowerCase().includes(q) ||
          b.subject.toLowerCase().includes(q)),
    );
  }, [query, existingBookIds, books]);

  function handleAdd(book: RegisteredBook) {
    onAdd(book);
    setQuery("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Plus className="h-3 w-3" />
            追加
          </button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>教材を追加</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="書名・教科で検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="max-h-72 overflow-y-auto">
          {books.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
              <BookOpen className="mb-2 h-8 w-8" />
              <p>教材が登録されていません</p>
              <p className="mt-1 text-xs">「教材登録」から教材を追加してください</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
              <BookOpen className="mb-2 h-8 w-8" />
              該当する教材がありません
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-muted"
                  onClick={() => handleAdd(book)}
                >
                  {book.coverImageUrl ? (
                    <img
                      src={book.coverImageUrl}
                      alt=""
                      className="h-10 w-8 shrink-0 rounded-sm border object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-8 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
                      {book.subject ? book.subject.slice(0, 1) : "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium">
                      {book.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {book.subject && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {book.subject}
                        </Badge>
                      )}
                      {book.targetGrade && (
                        <span className="text-[10px] text-muted-foreground">
                          {book.targetGrade}
                        </span>
                      )}
                    </div>
                  </div>
                  <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
