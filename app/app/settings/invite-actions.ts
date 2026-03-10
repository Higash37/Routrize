"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = { error: string | null };

/** 9桁の招待コードを生成（1時間有効） */
export async function generateInviteCode(
  storeId: string,
): Promise<{ code: string | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return { code: null, error: "未認証" };
  const user = session.user;

  const admin = createAdminClient();

  // 店舗から組織IDを取得
  const { data: store } = await admin
    .from("stores")
    .select("organization_id")
    .eq("id", storeId)
    .single();
  if (!store) return { code: null, error: "店舗が見つかりません" };

  // 9桁の数字コードを生成
  const code = generateNumericCode(9);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1時間後

  const { error } = await admin.from("invitations").insert({
    organization_id: store.organization_id,
    store_id: storeId,
    code,
    role: "teacher",
    expires_at: expiresAt,
    created_by: user.id,
  });

  if (error) return { code: null, error: error.message };
  return { code, error: null };
}

/** 招待コードを使って組織・店舗に参加 */
export async function joinWithCode(code: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return { error: "ログインが必要です" };
  const user = session.user;

  const admin = createAdminClient();

  // コード検索
  const { data: invitation } = await admin
    .from("invitations")
    .select("*")
    .eq("code", code.trim())
    .is("used_by", null)
    .single();

  if (!invitation) return { error: "無効な招待コードです" };

  // 有効期限チェック
  if (new Date(invitation.expires_at) < new Date()) {
    return { error: "招待コードの有効期限が切れています" };
  }

  // 既に同じ店舗のメンバーかチェック
  const { data: existing } = await admin
    .from("memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("store_id", invitation.store_id)
    .single();

  if (existing) return { error: "すでにこの店舗のメンバーです" };

  // メンバーシップ作成
  const { error: memberError } = await admin.from("memberships").insert({
    user_id: user.id,
    organization_id: invitation.organization_id,
    store_id: invitation.store_id,
    role: invitation.role,
  });

  if (memberError) return { error: memberError.message };

  // 招待コードを使用済みにする
  await admin
    .from("invitations")
    .update({ used_by: user.id, used_at: new Date().toISOString() })
    .eq("id", invitation.id);

  return { error: null };
}

function generateNumericCode(length: number): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}
