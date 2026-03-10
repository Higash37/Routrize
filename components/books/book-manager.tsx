"use client";

import { useState } from "react";
import { useBooks } from "@/hooks/use-books";
import { NavSidebar } from "@/components/shared/nav-sidebar";
import { BookList } from "./book-list";
import { BookForm } from "./book-form";
import type { RegisteredBook } from "@/types/book";
import { Menu, Plus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { UserMenuPopover } from "@/components/shared/user-menu-popover";


export function BookManager() {
  const { books, isLoaded, addBook, updateBook, removeBook } = useBooks();
  const [navOpen, setNavOpen] = useState(false);
  const { isLoggedIn, isLoading } = useAuth();
  const [editingBook, setEditingBook] = useState<RegisteredBook | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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
          books={books}
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
