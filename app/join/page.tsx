"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { joinWithCode } from "@/app/app/settings/invite-actions";

export default function JoinPage() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (code.replace(/\s/g, "").length !== 9) {
      setError("9桁のコードを入力してください");
      return;
    }

    startTransition(async () => {
      const result = await joinWithCode(code.replace(/\s/g, ""));
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/app/settings"), 2000);
      }
    });
  };

  // 入力を3桁ずつ区切って表示
  const handleCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 9);
    setCode(digits);
  };

  const displayCode = code.replace(/(\d{3})(?=\d)/g, "$1 ");

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-lg border bg-white p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h1 className="mt-4 text-lg font-semibold">参加しました！</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            設定画面に移動します...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border bg-white p-8">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <KeyRound className="h-6 w-6 text-blue-500" />
          </div>
          <h1 className="text-lg font-semibold">招待コードで参加</h1>
          <p className="text-sm text-muted-foreground text-center">
            オーナーから共有された9桁の招待コードを入力してください
          </p>
        </div>

        {!isLoading && !isLoggedIn && (
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-center">
            <p className="text-sm text-amber-700">
              参加するにはログインが必要です。
              <a href="/login" className="ml-1 font-medium underline">
                ログイン
              </a>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              inputMode="numeric"
              value={displayCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="000 000 000"
              className="h-12 w-full rounded-lg border px-4 text-center font-mono text-xl tracking-[0.3em] placeholder:tracking-[0.3em]"
              maxLength={11}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending || !isLoggedIn || code.length !== 9}
            className="h-10 w-full rounded-lg bg-blue-500 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {isPending ? "確認中..." : "参加する"}
          </button>
        </form>
      </div>
    </div>
  );
}
