import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** 認証 → 組織取得 → 教材取得 を1回で行う */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ books: [], organizationId: null });
  }

  const admin = createAdminClient();

  // メンバーシップ取得
  const { data: membership } = await admin
    .from("memberships")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    return NextResponse.json({ books: [], organizationId: null });
  }

  const orgId = membership.organization_id;

  // 教材取得
  const { data: books } = await admin
    .from("books")
    .select("*")
    .eq("organization_id", orgId)
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

  return NextResponse.json({ books: mapped, organizationId: orgId });
}
