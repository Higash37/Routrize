"use client";

import { useEffect, useRef } from "react";
import type { RouteState } from "@/types/route-builder";
import { useOrgContext } from "./use-org-context";

const DEBOUNCE_MS = 1500;

/**
 * ログイン時: カリキュラムを DB に自動保存するフック。
 * dbId が null なら新規作成、あれば更新。
 */
export function useDbRoute(
  state: RouteState & { dbId?: string },
  dispatch: React.Dispatch<{ type: "LOAD_ROUTE"; state: RouteState }>,
  setDbId: (id: string) => void,
  skipLoad = false,
  loadRouteId?: string | null,
) {
  const { storeId, isLoaded } = useOrgContext();
  const isInitialized = useRef(skipLoad);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStateRef = useRef<string>("");
  const pendingSaveRef = useRef<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // 初回: DB からカリキュラム一覧を取得して最新のものをロード
  useEffect(() => {
    if (!isLoaded || !storeId || isInitialized.current) return;
    isInitialized.current = true;

    fetch(`/api/routes?storeId=${storeId}`)
      .then((res) => res.json())
      .then((data) => {
        const routes = data.routes ?? [];
        if (routes.length > 0) {
          // 特定ルートIDが指定されていればそれを、なければ最新をロード
          const target = loadRouteId
            ? routes.find((r: { dbId: string }) => r.dbId === loadRouteId) ?? routes[0]
            : routes[0];
          setDbId(target.dbId);
          dispatch({
            type: "LOAD_ROUTE",
            state: {
              title: target.title,
              startDate: target.startDate,
              months: target.months,
              items: target.items,
              selectedItemId: null,
            },
          });
        }
      })
      .catch(() => {});
  }, [isLoaded, storeId, dispatch, setDbId, loadRouteId]);

  // debounce で DB に保存
  // ★ cleanup でタイマーを消さない（再レンダリングでタイマーが殺されるバグ防止）
  //   タイマー管理は effect 内の clear + flush effect の unmount で行う
  useEffect(() => {
    if (!isInitialized.current || !storeId) return;

    const stateStr = JSON.stringify({
      title: state.title,
      startDate: state.startDate,
      months: state.months,
      items: state.items,
    });
    if (stateStr === prevStateRef.current) return;
    prevStateRef.current = stateStr;

    const body = JSON.stringify({
      dbId: state.dbId || undefined,
      storeId,
      title: state.title,
      startDate: state.startDate,
      months: state.months,
      items: state.items,
    });
    pendingSaveRef.current = body;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      timerRef.current = null;
      pendingSaveRef.current = null;
      try {
        const res = await fetch("/api/routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        const data = await res.json();
        if (data.id && !stateRef.current.dbId) {
          setDbId(data.id);
        }
      } catch {
        // オフライン時は無視
      }
    }, DEBOUNCE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, storeId, setDbId]);

  // ページ離脱・コンポーネントunmount時に未保存データをflush
  useEffect(() => {
    const flush = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (!pendingSaveRef.current) return;
      navigator.sendBeacon(
        "/api/routes",
        new Blob([pendingSaveRef.current], { type: "application/json" }),
      );
      pendingSaveRef.current = null;
    };
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, []);
}
