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
) {
  const { storeId, isLoaded } = useOrgContext();
  const isInitialized = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStateRef = useRef<string>("");

  // 初回: DB からカリキュラム一覧を取得して最新のものをロード
  useEffect(() => {
    if (!isLoaded || !storeId || isInitialized.current) return;
    isInitialized.current = true;

    fetch(`/api/routes?storeId=${storeId}`)
      .then((res) => res.json())
      .then((data) => {
        const routes = data.routes ?? [];
        if (routes.length > 0) {
          const latest = routes[0];
          setDbId(latest.dbId);
          dispatch({
            type: "LOAD_ROUTE",
            state: {
              title: latest.title,
              startDate: latest.startDate,
              months: latest.months,
              items: latest.items,
              selectedItemId: null,
            },
          });
        }
      })
      .catch(() => {});
  }, [isLoaded, storeId, dispatch, setDbId]);

  // debounce で DB に保存
  useEffect(() => {
    if (!isInitialized.current || !storeId) return;

    // 状態が変わっていなければスキップ
    const stateStr = JSON.stringify({
      title: state.title,
      startDate: state.startDate,
      months: state.months,
      items: state.items,
    });
    if (stateStr === prevStateRef.current) return;
    prevStateRef.current = stateStr;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dbId: state.dbId || undefined,
            storeId,
            title: state.title,
            startDate: state.startDate,
            months: state.months,
            items: state.items,
          }),
        });
        const data = await res.json();
        if (data.id && !state.dbId) {
          setDbId(data.id);
        }
      } catch {
        // オフライン時は無視
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, storeId]);
}
