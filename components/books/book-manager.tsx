"use client";

import { useState } from "react";
import { useLocalStorageBooks } from "@/hooks/use-local-storage-books";
import { NavSidebar } from "@/components/shared/nav-sidebar";
import { BookList } from "./book-list";
import { BookForm } from "./book-form";
import type { RegisteredBook } from "@/types/book";
import { Menu, Plus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BookManager() {
  const { books, isLoaded, addBook, updateBook, removeBook } = useLocalStorageBooks();
  const [navOpen, setNavOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<RegisteredBook | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  function handleSave(book: RegisteredBook) {
    if (editingBook) {
      updateBook(book.id, book);
    } else {
      addBook(book);
    }
    setEditingBook(null);
    setIsCreating(false);
  }

  function handleCancel() {
    setEditingBook(null);
    setIsCreating(false);
  }

  if (!isLoaded) return null;

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
          <Button
            size="sm"
            className="h-7 gap-1.5 text-xs bg-[#1F3864] hover:bg-[#2B5797]"
            disabled
          >
            <LogIn className="h-3.5 w-3.5" />
            ログイン
          </Button>
        </div>
      </header>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto">
        <BookList
          books={books}
          onEdit={setEditingBook}
          onRemove={removeBook}
        />
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
