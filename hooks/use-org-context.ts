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

/** ログインユーザーの組織・店舗コンテキストを取得 */
export function useOrgContext(): OrgContext {
  const { isLoggedIn, isLoading } = useAuth();
  const [ctx, setCtx] = useState<OrgContext>({
    organizationId: null,
    storeId: null,
    role: null,
    isLoaded: false,
  });

  useEffect(() => {
    if (isLoading) return;

    if (!isLoggedIn) {
      setCtx({ organizationId: null, storeId: null, role: null, isLoaded: true });
      sessionStorage.removeItem(CACHE_KEY);
      return;
    }

    // セッションキャッシュがあればそれを使う
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setCtx({ ...parsed, isLoaded: true });
        return;
      } catch {
        // ignore
      }
    }

    // サーバーから取得
    fetchOrgContext().then((data) => {
      const result = {
        organizationId: data.organizationId,
        storeId: data.storeId,
        role: data.role,
      };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(result));
      setCtx({ ...result, isLoaded: true });
    });
  }, [isLoggedIn, isLoading]);

  return ctx;
}

async function fetchOrgContext(): Promise<{
  organizationId: string | null;
  storeId: string | null;
  role: string | null;
}> {
  const res = await fetch("/api/org-context");
  if (!res.ok) return { organizationId: null, storeId: null, role: null };
  return res.json();
}
