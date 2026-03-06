import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  // ユーザー取得
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // 初回ログイン（組織未作成）なら組織を自動作成
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("memberships")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    if (!existing || existing.length === 0) {
      const orgName =
        (user.user_metadata?.org_name as string) ||
        (user.user_metadata?.full_name as string) ||
        "マイ塾";

      await setupOrganization(admin, user.id, orgName);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}

async function setupOrganization(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  orgName: string,
) {
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name: orgName })
    .select("id")
    .single();

  if (orgError) return;

  await admin
    .from("subscriptions")
    .insert({ organization_id: org.id, plan: "free", status: "active" });

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

  if (storeError) return;

  await admin.from("memberships").insert({
    user_id: userId,
    organization_id: org.id,
    store_id: store.id,
    role: "owner",
  });
}

function generateStoreCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
