"use client";

import { useState, useEffect, useCallback } from "react";
import type { RegisteredBook } from "@/types/book";

const BOOKS_KEY = "routrize:books";

export function useLocalStorageBooks() {
  const [books, setBooks] = useState<RegisteredBook[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(BOOKS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, unknown>[];
        setBooks(
          parsed.map((b) => ({
            ...(b as RegisteredBook),
            description: (b.description as string) ?? "",
            resources: (b.resources as unknown[]) ?? [],
          })) as RegisteredBook[],
        );
      }
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    } catch {
      // storage full
    }
  }, [books, isLoaded]);

  const addBook = useCallback((book: RegisteredBook) => {
    setBooks((prev) => [...prev, book]);
  }, []);

  const updateBook = useCallback((id: string, changes: Partial<RegisteredBook>) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...changes } : b)),
    );
  }, []);

  const removeBook = useCallback((id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return { books, isLoaded, addBook, updateBook, removeBook };
}
