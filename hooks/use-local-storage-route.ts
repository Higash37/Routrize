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
  skipLoad = false,
) {
  const { isLoggedIn, isLoading } = useAuth();
  const isInitialized = useRef(skipLoad);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<string | null>(null);

  // auth読み込み完了後にlocalStorageからデータ復元（ゲストのみ）
  // skipLoad=true の場合はキャッシュから復元済みなのでスキップ
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
          localStorage.removeItem(GUEST_ROUTE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(GUEST_ROUTE_KEY);
    }
  }, [dispatch, isLoading, isLoggedIn]);

  // debounce保存（ゲストのみ）
  // ★ cleanup でタイマーを消さない（再レンダリングでタイマーが殺されるバグ防止）
  useEffect(() => {
    if (!isInitialized.current || isLoggedIn) return;

    const stateStr = JSON.stringify(state);
    pendingRef.current = stateStr;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      pendingRef.current = null;
      try {
        localStorage.setItem(GUEST_ROUTE_KEY, stateStr);
      } catch {
        // storage full等は無視
      }
    }, DEBOUNCE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isLoggedIn]);

  // ページ離脱・コンポーネントunmount時に未保存データをflush
  useEffect(() => {
    const flush = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (!pendingRef.current) return;
      try {
        localStorage.setItem(GUEST_ROUTE_KEY, pendingRef.current);
      } catch {}
      pendingRef.current = null;
    };
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(GUEST_ROUTE_KEY);
  }, []);

  return { clear };
}
