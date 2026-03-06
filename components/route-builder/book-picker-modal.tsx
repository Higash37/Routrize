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
import { MOCK_BOOKS } from "@/lib/mock-books";
import type { MockBook } from "@/types/route-builder";

type BookPickerModalProps = {
  existingBookIds: string[];
  onAdd: (book: MockBook) => void;
};

const SUBJECT_COLORS: Record<string, string> = {
  英語: "bg-blue-100 text-blue-700",
  数学: "bg-emerald-100 text-emerald-700",
  物理: "bg-amber-100 text-amber-700",
  化学: "bg-violet-100 text-violet-700",
  国語: "bg-rose-100 text-rose-700",
  社会: "bg-cyan-100 text-cyan-700",
};

const LEVEL_LABELS: Record<string, string> = {
  basic: "基礎",
  standard: "標準",
  advanced: "難関",
};

export function BookPickerModal({
  existingBookIds,
  onAdd,
}: BookPickerModalProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return MOCK_BOOKS.filter(
      (b) =>
        !existingBookIds.includes(b.id) &&
        (b.title.toLowerCase().includes(q) ||
          b.subject.toLowerCase().includes(q)),
    );
  }, [query, existingBookIds]);

  function handleAdd(book: MockBook) {
    onAdd(book);
    setQuery("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Plus className="h-3 w-3" />
          追加
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>参考書を追加</DialogTitle>
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
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
              <BookOpen className="mb-2 h-8 w-8" />
              該当する参考書がありません
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
                  <div className="flex h-10 w-8 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
                    {book.subject.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium">
                      {book.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 ${SUBJECT_COLORS[book.subject] ?? ""}`}
                      >
                        {book.subject}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {LEVEL_LABELS[book.level]}
                      </span>
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
