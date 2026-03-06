"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthResult = {
  error: string | null;
};

export async function login(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/app/dashboard");
}

export async function signup(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const orgName = (formData.get("orgName") as string) || "マイ塾";

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { org_name: orgName },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  // メール確認が必要な場合（identities が空 or email_confirmed_at が null）
  const needsConfirmation =
    !authData.user?.email_confirmed_at &&
    (authData.user?.identities?.length ?? 0) > 0;

  if (needsConfirmation) {
    return { error: "__check_email__" };
  }

  // メール確認不要（即ログイン可能）の場合は組織を作成
  if (authData.user) {
    const admin = createAdminClient();
    const { error: setupError } = await setupOrganization(
      admin,
      authData.user.id,
      orgName,
    );
    if (setupError) {
      return { error: setupError };
    }
  }

  revalidatePath("/", "layout");
  redirect("/app/dashboard");
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: "リダイレクトURLの取得に失敗しました" };
}

async function setupOrganization(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  orgName: string,
): Promise<{ error: string | null }> {
  // 1. 組織作成
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name: orgName })
    .select("id")
    .single();

  if (orgError) return { error: orgError.message };

  // 2. サブスクリプション作成（free）
  await admin
    .from("subscriptions")
    .insert({ organization_id: org.id, plan: "free", status: "active" });

  // 3. デフォルト店舗作成
  const storeCode = generateStoreCode();
  const { data: store, error: storeError } = await admin
    .from("stores")
    .insert({
      organization_id: org.id,
      name: "本校",
      store_code: storeCode,
    })
    .select("id")
    .single();

  if (storeError) return { error: storeError.message };

  // 4. メンバーシップ作成（owner）
  const { error: memberError } = await admin.from("memberships").insert({
    user_id: userId,
    organization_id: org.id,
    store_id: store.id,
    role: "owner",
  });

  if (memberError) return { error: memberError.message };

  return { error: null };
}

function generateStoreCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
