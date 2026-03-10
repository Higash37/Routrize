"use client";

import { BookMarked, Pencil, Trash2, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RegisteredBook } from "@/types/book";
import { useAuth } from "@/hooks/use-auth";

type BookListProps = {
  books: RegisteredBook[];
  onEdit: (book: RegisteredBook) => void;
  onRemove: (id: string) => void;
  onTogglePublish?: (id: string, published: boolean) => void;
};

export function BookList({ books, onEdit, onRemove, onTogglePublish }: BookListProps) {
  const { isLoggedIn } = useAuth();
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <BookMarked className="mb-4 h-12 w-12 text-muted-foreground/30" />
        <p className="text-base">教材が登録されていません</p>
        <p className="mt-1 text-sm text-muted-foreground/60">
          「新規登録」から教材を追加してください
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-3 sm:p-6">
      <div className="grid gap-3">
        {books.map((book) => (
          <div
            key={book.id}
            className="flex items-center gap-4 rounded-lg border bg-white p-4 transition-colors hover:bg-slate-50"
          >
            {/* 表紙 */}
            {book.coverImageUrl ? (
              <img
                src={book.coverImageUrl}
                alt=""
                className="h-16 w-12 shrink-0 rounded border object-cover"
              />
            ) : (
              <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded bg-slate-200 text-sm font-bold text-slate-500">
                {book.title.slice(0, 1)}
              </div>
            )}

            {/* 情報 */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#1F3864]">{book.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {book.subject && (
                  <span className="rounded bg-[#1F3864] px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {book.subject}
                  </span>
                )}
                {book.fields.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700"
                  >
                    {f}
                  </span>
                ))}
                {book.targetGrade && (
                  <span className="text-[10px] text-muted-foreground">
                    {book.targetGrade}
                  </span>
                )}
                {book.totalPages > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {book.totalPages}p.
                  </span>
                )}
                {book.chapters.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {book.chapters.length}章
                  </span>
                )}
              </div>
            </div>

            {/* アクション */}
            <div className="flex shrink-0 gap-1">
              {isLoggedIn && onTogglePublish && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${book.visibility === "public" ? "text-green-500" : "text-muted-foreground"}`}
                  title={book.visibility === "public" ? "公開中（クリックで非公開に）" : "非公開（クリックで公開に）"}
                  onClick={() =>
                    onTogglePublish(book.id, book.visibility !== "public")
                  }
                >
                  {book.visibility === "public" ? (
                    <Globe className="h-3.5 w-3.5" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(book)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                onClick={() => onRemove(book.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
