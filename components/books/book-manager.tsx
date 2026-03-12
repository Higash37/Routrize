"use client";

import { useState, useMemo } from "react";
import { useBooks } from "@/hooks/use-books";
import { NavSidebar } from "@/components/shared/nav-sidebar";
import { BookList } from "./book-list";
import { BookForm } from "./book-form";
import type { RegisteredBook } from "@/types/book";
import { Menu, Plus, LogIn, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { UserMenuPopover } from "@/components/shared/user-menu-popover";


export function BookManager() {
  const { books, isLoaded, addBook, updateBook, removeBook } = useBooks();
  const [navOpen, setNavOpen] = useState(false);
  const { isLoggedIn, isLoading } = useAuth();
  const [editingBook, setEditingBook] = useState<RegisteredBook | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [gradeFilters, setGradeFilters] = useState<Set<string>>(new Set());
  const [subjectFilters, setSubjectFilters] = useState<Set<string>>(new Set());

  // 教材から学年・科目の選択肢を抽出
  const { grades, subjects } = useMemo(() => {
    const gs = new Map<string, number>();
    const ss = new Map<string, number>();
    for (const b of books) {
      if (b.targetGrade) gs.set(b.targetGrade, (gs.get(b.targetGrade) ?? 0) + 1);
      if (b.subject) ss.set(b.subject, (ss.get(b.subject) ?? 0) + 1);
    }
    return {
      grades: [...gs.entries()].sort((a, b) => b[1] - a[1]),
      subjects: [...ss.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [books]);

  function toggleFilter(set: Set<string>, value: string, setter: (s: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  // フィルター適用
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      if (gradeFilters.size > 0 && !gradeFilters.has(b.targetGrade)) return false;
      if (subjectFilters.size > 0 && !subjectFilters.has(b.subject)) return false;
      return true;
    });
  }, [books, gradeFilters, subjectFilters]);

  function handleSave(book: RegisteredBook) {
    // UI を即閉じて、バックグラウンドで保存
    setEditingBook(null);
    setIsCreating(false);
    if (editingBook) {
      updateBook(book.id, book);
    } else {
      addBook(book);
    }
  }

  function handleCancel() {
    setEditingBook(null);
    setIsCreating(false);
  }

  const showForm = isCreating || editingBook !== null;

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <NavSidebar isOpen={navOpen} onClose={() => setNavOpen(false)} />

      {/* ヘッダー */}
      <header className="border-b bg-white">
        <div className="flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded p-1 text-muted-foreground hover:bg-slate-100 transition-colors"
              onClick={() => setNavOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-base font-bold text-[#1F3864]">教材登録</span>
          </div>
          {isLoading ? (
            <div className="h-7 w-[5.5rem] rounded" />
          ) : isLoggedIn ? (
            <UserMenuPopover />
          ) : (
            <Button
              size="sm"
              className="h-7 gap-1.5 text-xs bg-[#1F3864] hover:bg-[#2B5797]"
              asChild
            >
              <Link href="/login">
                <LogIn className="h-3.5 w-3.5" />
                ログイン
              </Link>
            </Button>
          )}
        </div>
      </header>

      {/* フィルター */}
      {isLoaded && books.length > 0 && (
        <div className="border-b bg-white px-4 py-2">
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            {/* 学年フィルター */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    gradeFilters.size > 0
                      ? "border-[#1F3864] bg-[#1F3864]/5 text-[#1F3864]"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  学年
                  {gradeFilters.size > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1F3864] px-1 text-[10px] font-medium text-white">
                      {gradeFilters.size}
                    </span>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="space-y-1">
                  {grades.map(([grade, count]) => (
                    <label
                      key={grade}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50"
                    >
                      <Checkbox
                        checked={gradeFilters.has(grade)}
                        onCheckedChange={() => toggleFilter(gradeFilters, grade, setGradeFilters)}
                      />
                      <span className="flex-1">{grade}</span>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* 科目フィルター */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    subjectFilters.size > 0
                      ? "border-blue-600 bg-blue-50 text-blue-600"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  科目
                  {subjectFilters.size > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-medium text-white">
                      {subjectFilters.size}
                    </span>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="max-h-64 w-48 overflow-y-auto p-2" align="start">
                <div className="space-y-1">
                  {subjects.map(([subject, count]) => (
                    <label
                      key={subject}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50"
                    >
                      <Checkbox
                        checked={subjectFilters.has(subject)}
                        onCheckedChange={() => toggleFilter(subjectFilters, subject, setSubjectFilters)}
                      />
                      <span className="flex-1">{subject}</span>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* クリア */}
            {(gradeFilters.size > 0 || subjectFilters.size > 0) && (
              <button
                type="button"
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => { setGradeFilters(new Set()); setSubjectFilters(new Set()); }}
              >
                <X className="h-3 w-3" />
                クリア
              </button>
            )}

            {/* 件数 */}
            {(gradeFilters.size > 0 || subjectFilters.size > 0) && (
              <span className="ml-auto text-xs text-muted-foreground">
                {filteredBooks.length}/{books.length}件
              </span>
            )}
          </div>
        </div>
      )}

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto">
        {!isLoaded ? (
          <div className="mx-auto max-w-3xl p-3 sm:p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 rounded-lg border bg-white p-4">
                <div className="h-16 w-12 rounded bg-slate-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-slate-200 animate-pulse" />
                  <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
        <BookList
          books={filteredBooks}
          onEdit={setEditingBook}
          onRemove={removeBook}
          onTogglePublish={(id, published) =>
            updateBook(id, {
              visibility: published ? "public" : "private",
              publishedAt: published ? new Date().toISOString() : null,
            })
          }
        />
        )}
      </div>

      {/* モーダル */}
      {showForm && (
        <BookForm
          book={editingBook}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {!showForm && (
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-[#1F3864] hover:bg-[#2B5797] shadow-lg"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
