"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./use-auth";

type OrgContext = {
  organizationId: string | null;
  storeId: string | null;
  role: string | null;
  isLoaded: boolean;
};

const CACHE_KEY = "routrize:org-context";

// モジュールレベルキャッシュ（同一セッション内でAPIを1回だけ呼ぶ）
let moduleCache: { organizationId: string | null; storeId: string | null; role: string | null } | null = null;
let fetchPromise: Promise<typeof moduleCache> | null = null;

function fetchOrgContext(): Promise<typeof moduleCache> {
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch("/api/org-context")
    .then((res) => res.json())
    .then((data) => {
      moduleCache = data;
      return data;
    })
    .catch(() => {
      moduleCache = { organizationId: null, storeId: null, role: null };
      return moduleCache;
    });
  return fetchPromise;
}

/** ログインユーザーの組織・店舗コンテキストを取得 */
export function useOrgContext(): OrgContext {
  const { isLoggedIn, isLoading } = useAuth();
  const [ctx, setCtx] = useState<OrgContext>(() => {
    // モジュールキャッシュがあれば即返す
    if (moduleCache) {
      return { ...moduleCache, isLoaded: true };
    }
    return { organizationId: null, storeId: null, role: null, isLoaded: false };
  });

  useEffect(() => {
    if (isLoading) return;

    if (!isLoggedIn) {
      moduleCache = null;
      fetchPromise = null;
      setCtx({ organizationId: null, storeId: null, role: null, isLoaded: true });
      return;
    }

    // キャッシュがあればスキップ
    if (moduleCache) {
      setCtx({ ...moduleCache, isLoaded: true });
      return;
    }

    fetchOrgContext().then((data) => {
      if (data) setCtx({ ...data, isLoaded: true });
    });
  }, [isLoggedIn, isLoading]);

  return ctx;
}

/** キャッシュをリセット（ログアウト時等） */
export function resetOrgContextCache() {
  moduleCache = null;
  fetchPromise = null;
}
