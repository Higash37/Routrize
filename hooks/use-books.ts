"use client";

import { useAuth } from "./use-auth";
import { useLocalStorageBooks } from "./use-local-storage-books";
import { useDbBooks } from "./use-db-books";
import type { RegisteredBook } from "@/types/book";

/** ログイン時はDB、ゲスト時はlocalStorageから教材を読み書きする統合フック */
export function useBooks() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const ls = useLocalStorageBooks();
  const db = useDbBooks();

  // 認証ロード中
  if (authLoading) {
    return {
      books: [] as RegisteredBook[],
      isLoaded: false,
      addBook: async (_book: RegisteredBook) => {},
      updateBook: async (_id: string, _changes: Partial<RegisteredBook>) => {},
      removeBook: async (_id: string) => {},
    };
  }

  if (isLoggedIn) {
    return {
      books: db.books,
      isLoaded: db.isLoaded,
      addBook: db.addBook,
      updateBook: db.updateBook,
      removeBook: db.removeBook,
    };
  }

  return {
    books: ls.books,
    isLoaded: ls.isLoaded,
    addBook: async (book: RegisteredBook) => ls.addBook(book),
    updateBook: async (id: string, changes: Partial<RegisteredBook>) =>
      ls.updateBook(id, changes),
    removeBook: async (id: string) => ls.removeBook(id),
  };
}
