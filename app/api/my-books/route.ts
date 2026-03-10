import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** 認証 → 組織取得 → 教材取得 を1回で行う */
export async function GET() {
  const supabase = await createClient();
  // getSession()はcookieのJWTを読むだけで高速（getUser()はネットワーク往復~1秒）
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ books: [], organizationId: null });
  }

  const admin = createAdminClient();

  // 全メンバーシップ取得（複数組織に所属している場合がある）
  const { data: memberships } = await admin
    .from("memberships")
    .select("organization_id")
    .eq("user_id", session.user.id);

  if (!memberships || memberships.length === 0) {
    return NextResponse.json({ books: [], organizationId: null });
  }

  const orgIds = [...new Set(memberships.map((m) => m.organization_id))];

  // 所属する全組織の教材を取得
  const { data: books } = await admin
    .from("books")
    .select("*")
    .in("organization_id", orgIds)
    .order("created_at", { ascending: false });

  const mapped = (books ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    subject: b.subject,
    fields: b.fields ?? [],
    targetGrade: b.target_grade ?? "",
    tags: b.tags ?? [],
    totalPages: b.total_pages ?? 0,
    chapters: [],
    coverImageUrl: b.cover_image_url,
    description: b.description ?? "",
    resources: [],
    createdAt: b.created_at,
    organizationId: b.organization_id,
    creatorUserId: b.creator_user_id,
    visibility: b.visibility ?? "private",
    publishedAt: b.published_at,
    usageCount: b.usage_count ?? 0,
    likeCount: b.like_count ?? 0,
  }));

  // 最初の組織IDを返す（教材追加時のデフォルト）
  return NextResponse.json({ books: mapped, organizationId: orgIds[0] });
}
