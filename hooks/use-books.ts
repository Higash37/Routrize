"use client";

import { useLocalStorageBooks } from "./use-local-storage-books";
import { useDbBooks } from "./use-db-books";
import { useOrgContext } from "./use-org-context";
import type { RegisteredBook } from "@/types/book";

/** ログイン時はDB、ゲスト時はlocalStorageから教材を読み書きする統合フック */
export function useBooks() {
  const ls = useLocalStorageBooks();
  const { organizationId: activeOrgId } = useOrgContext();
  const db = useDbBooks(activeOrgId);

  // APIが完了するまではローディング
  if (!db.isLoaded) {
    return {
      books: [] as RegisteredBook[],
      isLoaded: false,
      addBook: async (_book: RegisteredBook) => {},
      updateBook: async (_id: string, _changes: Partial<RegisteredBook>) => {},
      removeBook: async (_id: string) => {},
    };
  }

  // APIがorganizationIdを返した → ログイン済み → DB教材を使う
  if (db.organizationId) {
    return {
      books: db.books,
      isLoaded: true,
      addBook: db.addBook,
      updateBook: db.updateBook,
      removeBook: db.removeBook,
    };
  }

  // organizationIdがない → ゲスト → localStorage
  return {
    books: ls.books,
    isLoaded: ls.isLoaded,
    addBook: async (book: RegisteredBook) => ls.addBook(book),
    updateBook: async (id: string, changes: Partial<RegisteredBook>) =>
      ls.updateBook(id, changes),
    removeBook: async (id: string) => ls.removeBook(id),
  };
}
