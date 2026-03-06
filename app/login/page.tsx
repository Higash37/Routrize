"use client";

import { useState } from "react";
import { login, signup, signInWithGoogle } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    try {
      const result = isSignUp ? await signup(formData) : await login(formData);
      if (result?.error === "__check_email__") {
        setCheckEmail(true);
      } else if (result?.error) {
        setError(result.error);
      }
    } catch {
      // redirect() throws — 正常動作
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      // redirect() throws
    } finally {
      setLoading(false);
    }
  }

  // メール確認案内画面
  if (checkEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="w-full max-w-sm space-y-6 rounded-lg border bg-white p-8 shadow-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <Mail className="h-8 w-8 text-[#1F3864]" />
          </div>
          <h1 className="text-xl font-bold text-[#1F3864]">
            メールを確認してください
          </h1>
          <p className="text-sm text-muted-foreground">
            確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setCheckEmail(false);
              setIsSignUp(false);
            }}
          >
            ログイン画面に戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1F3864]">Routrize</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignUp ? "アカウントを作成" : "ログイン"}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Google OAuth */}
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          disabled={loading}
          onClick={handleGoogle}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Googleで{isSignUp ? "登録" : "ログイン"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-muted-foreground">または</span>
          </div>
        </div>

        <form action={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <label htmlFor="orgName" className="text-sm font-medium">
                塾名
              </label>
              <Input
                id="orgName"
                name="orgName"
                type="text"
                placeholder="例: ○○学習塾"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              メールアドレス
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              パスワード
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="6文字以上"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#1F3864] hover:bg-[#2B5797]"
            disabled={loading}
          >
            {loading
              ? "処理中..."
              : isSignUp
                ? "アカウント作成"
                : "ログイン"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          {isSignUp ? (
            <>
              すでにアカウントがある方は{" "}
              <button
                type="button"
                className="font-medium text-[#1F3864] hover:underline"
                onClick={() => {
                  setIsSignUp(false);
                  setError(null);
                }}
              >
                ログイン
              </button>
            </>
          ) : (
            <>
              アカウントをお持ちでない方は{" "}
              <button
                type="button"
                className="font-medium text-[#1F3864] hover:underline"
                onClick={() => {
                  setIsSignUp(true);
                  setError(null);
                }}
              >
                新規登録
              </button>
            </>
          )}
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:underline"
          >
            ゲストとして使う
          </Link>
        </div>
      </div>
    </div>
  );
}
