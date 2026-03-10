"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrganizationRow, StoreRow, MembershipRow } from "@/types/database";

type ActionResult = { error: string | null };

export type StoreMember = {
  userId: string;
  email: string;
  role: string;
  joinedAt: string;
};

/** ログインユーザーの組織・店舗・メンバーシップを取得 */
export async function getOrgData(): Promise<{
  organization: OrganizationRow | null;
  stores: StoreRow[];
  membership: MembershipRow | null;
  /** storeId → メンバー一覧 */
  membersByStore: Record<string, StoreMember[]>;
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { organization: null, stores: [], membership: null, membersByStore: {}, error: "未認証" };

  const admin = createAdminClient();

  // メンバーシップ取得
  const { data: membership } = await admin
    .from("memberships")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) return { organization: null, stores: [], membership: null, membersByStore: {}, error: null };

  // 組織取得 + 店舗一覧 + 組織全体のメンバーシップを並列取得
  const [orgResult, storesResult, allMembershipsResult] = await Promise.all([
    admin
      .from("organizations")
      .select("*")
      .eq("id", membership.organization_id)
      .single(),
    admin
      .from("stores")
      .select("*")
      .eq("organization_id", membership.organization_id)
      .order("created_at", { ascending: true }),
    admin
      .from("memberships")
      .select("*")
      .eq("organization_id", membership.organization_id),
  ]);

  const allMemberships = (allMembershipsResult.data ?? []) as MembershipRow[];

  // ユニークなuser_idを集めてメール取得
  const userIds = [...new Set(allMemberships.map((m) => m.user_id))];
  const membersByStore: Record<string, StoreMember[]> = {};

  if (userIds.length > 0) {
    const userMap = new Map<string, string>();
    // admin.auth.admin.listUsers は最大1000件返す
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
    for (const u of users) {
      if (userIds.includes(u.id)) {
        userMap.set(u.id, u.email ?? "");
      }
    }

    for (const m of allMemberships) {
      const storeId = m.store_id;
      if (!membersByStore[storeId]) membersByStore[storeId] = [];
      membersByStore[storeId].push({
        userId: m.user_id,
        email: userMap.get(m.user_id) ?? "",
        role: m.role,
        joinedAt: m.created_at,
      });
    }
  }

  return {
    organization: orgResult.data ?? null,
    stores: storesResult.data ?? [],
    membership: membership as MembershipRow,
    membersByStore,
    error: null,
  };
}

/** 組織名を変更 */
export async function updateOrgName(orgId: string, name: string): Promise<ActionResult> {
  if (!name.trim()) return { error: "組織名を入力してください" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({ name: name.trim(), updated_at: new Date().toISOString() })
    .eq("id", orgId);

  if (error) return { error: error.message };
  return { error: null };
}

/** 店舗を追加 */
export async function addStore(orgId: string, name: string): Promise<ActionResult> {
  if (!name.trim()) return { error: "店舗名を入力してください" };

  const admin = createAdminClient();
  const storeCode = generateStoreCode();

  const { error } = await admin.from("stores").insert({
    organization_id: orgId,
    name: name.trim(),
    store_code: storeCode,
  });

  if (error) return { error: error.message };
  return { error: null };
}

/** 店舗名を変更 */
export async function updateStoreName(storeId: string, name: string): Promise<ActionResult> {
  if (!name.trim()) return { error: "店舗名を入力してください" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("stores")
    .update({ name: name.trim(), updated_at: new Date().toISOString() })
    .eq("id", storeId);

  if (error) return { error: error.message };
  return { error: null };
}

/** 店舗を削除 */
export async function deleteStore(storeId: string): Promise<ActionResult> {
  const admin = createAdminClient();
  const { error } = await admin.from("stores").delete().eq("id", storeId);

  if (error) return { error: error.message };
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
