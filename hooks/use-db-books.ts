"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { RegisteredBook } from "@/types/book";

/** ログイン時: DB から教材を取得・保存するフック（API 1回で完結） */
export function useDbBooks() {
  const [books, setBooks] = useState<RegisteredBook[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const booksRef = useRef(books);
  booksRef.current = books;

  // マウント時に即座にAPI呼び出し（サーバー側でauth確認するので待つ必要なし）
  useEffect(() => {
    fetch("/api/my-books")
      .then((res) => res.json())
      .then((data) => {
        setBooks(data.books ?? []);
        setOrganizationId(data.organizationId ?? null);
        setIsDbLoaded(true);
      })
      .catch(() => setIsDbLoaded(true));
  }, []);

  const addBook = useCallback(
    async (book: RegisteredBook) => {
      if (!organizationId) return;
      // 楽観的更新
      setBooks((prev) => [{ ...book, organizationId }, ...prev]);
      fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...book, organizationId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.id) {
            setBooks((prev) =>
              prev.map((b) => (b.id === book.id ? { ...b, id: data.id } : b)),
            );
          }
        })
        .catch(() => {});
    },
    [organizationId],
  );

  const updateBook = useCallback(
    async (id: string, changes: Partial<RegisteredBook>) => {
      setBooks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...changes } : b)),
      );
      const book = booksRef.current.find((b) => b.id === id);
      if (book) {
        fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...book, ...changes, dbId: id, organizationId }),
        }).catch(() => {});
      }
    },
    [organizationId],
  );

  const removeBook = useCallback(async (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    fetch(`/api/books?id=${id}`, { method: "DELETE" }).catch(() => {});
  }, []);

  return { books, isLoaded: isDbLoaded, addBook, updateBook, removeBook, organizationId };
}
