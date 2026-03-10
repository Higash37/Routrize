"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { RouteState, RouteItemState } from "@/types/route-builder";
import { DEFAULT_ITEM_COLOR } from "@/lib/constants";

const GUEST_ROUTE_KEY = "routrize:guest-route";
const DEBOUNCE_MS = 500;

/** 保存データが新しい日付ベース形式か検証 */
function isValidRouteState(data: unknown): data is RouteState {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.startDate === "string" &&
    typeof d.months === "number" &&
    Array.isArray(d.items) &&
    d.items.every(
      (item: unknown) =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).startDate === "string" &&
        typeof (item as Record<string, unknown>).endDate === "string",
    )
  );
}

/** 旧データに足りないフィールドをデフォルト値で補完 */
function migrateItems(items: RouteItemState[]): RouteItemState[] {
  return items.map((item) => ({
    ...item,
    subject: item.subject ?? "",
    fields: Array.isArray(item.fields) ? item.fields : ((item as unknown as Record<string, unknown>).field ? [String((item as unknown as Record<string, unknown>).field)] : []),
    color: item.color ?? DEFAULT_ITEM_COLOR,
    targetGrade: item.targetGrade ?? "",
    tags: item.tags ?? [],
    difficulty: item.difficulty ?? 3,
    importance: item.importance ?? 3,
    memo: item.memo ?? "",
    totalPages: item.totalPages ?? 0,
    chapters: item.chapters ?? [],
    targetRounds: item.targetRounds ?? 1,
    subtasks: item.subtasks ?? [],
  }));
}

export function useLocalStorageRoute(
  state: RouteState,
  dispatch: React.Dispatch<{ type: "LOAD_ROUTE"; state: RouteState }>,
) {
  const { isLoggedIn, isLoading } = useAuth();
  const isInitialized = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ログイン時は localStorage を使わない（useDbRoute が担当）
  // 初回読み込み
  useEffect(() => {
    if (isLoading) return;
    if (isLoggedIn) return;
    if (isInitialized.current) return;
    isInitialized.current = true;

    try {
      const saved = localStorage.getItem(GUEST_ROUTE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isValidRouteState(parsed)) {
          parsed.items = migrateItems(parsed.items);
          dispatch({ type: "LOAD_ROUTE", state: parsed });
        } else {
          // 古い形式のデータは削除
          localStorage.removeItem(GUEST_ROUTE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(GUEST_ROUTE_KEY);
    }
  }, [dispatch]);

  // debounce保存（ゲストのみ）
  useEffect(() => {
    if (!isInitialized.current || isLoggedIn) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(GUEST_ROUTE_KEY, JSON.stringify(state));
      } catch {
        // storage full等は無視
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state]);

  const clear = useCallback(() => {
    localStorage.removeItem(GUEST_ROUTE_KEY);
  }, []);

  return { clear };
}
