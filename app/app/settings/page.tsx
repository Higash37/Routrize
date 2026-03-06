"use client";

import { useAuth } from "@/hooks/use-auth";

export default function SettingsPage() {
  const { email } = useAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">設定</h1>

      {/* プロフィール */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="text-base font-semibold mb-4">プロフィール</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1F3864] text-xl font-bold text-white">
            {email ? email[0].toUpperCase() : "?"}
          </div>
          <div>
            <p className="text-sm font-medium">{email || "---"}</p>
            <p className="text-xs text-muted-foreground">メールアドレス</p>
          </div>
        </div>
      </section>

      {/* 組織情報 */}
      <section className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">組織・店舗</h2>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-muted-foreground">
            開発中
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          組織名の変更、店舗の追加・編集、メンバー招待などを行えます。
        </p>
      </section>

      {/* サブスクリプション */}
      <section className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">プラン</h2>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-muted-foreground">
            開発中
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          現在のプランの確認やアップグレードを行えます。
        </p>
      </section>
    </div>
  );
}
