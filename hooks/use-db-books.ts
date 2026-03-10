"use client";

import { useState, useEffect, useCallback } from "react";
import type { RegisteredBook } from "@/types/book";
import { useOrgContext } from "./use-org-context";

/** ログイン時: DB から教材を取得・保存するフック */
export function useDbBooks() {
  const { organizationId, isLoaded } = useOrgContext();
  const [books, setBooks] = useState<RegisteredBook[]>([]);
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // DB から取得
  useEffect(() => {
    if (!isLoaded || !organizationId) {
      if (isLoaded) setIsDbLoaded(true);
      return;
    }

    fetch(`/api/books?orgId=${organizationId}`)
      .then((res) => res.json())
      .then((data) => {
        setBooks(data.books ?? []);
        setIsDbLoaded(true);
      })
      .catch(() => setIsDbLoaded(true));
  }, [organizationId, isLoaded]);

  const addBook = useCallback(
    async (book: RegisteredBook) => {
      if (!organizationId) return;
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...book, organizationId }),
      });
      const data = await res.json();
      if (data.id) {
        setBooks((prev) => [
          { ...book, id: data.id, organizationId },
          ...prev,
        ]);
      }
    },
    [organizationId],
  );

  const updateBook = useCallback(
    async (id: string, changes: Partial<RegisteredBook>) => {
      setBooks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...changes } : b)),
      );
      const book = books.find((b) => b.id === id);
      if (book) {
        await fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...book, ...changes, dbId: id, organizationId }),
        });
      }
    },
    [books, organizationId],
  );

  const removeBook = useCallback(async (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    await fetch(`/api/books?id=${id}`, { method: "DELETE" });
  }, []);

  return { books, isLoaded: isDbLoaded, addBook, updateBook, removeBook, organizationId };
}
