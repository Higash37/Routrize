import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** 認証 → 同じ校舎のメンバーの教材も含めて取得 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ books: [], organizationId: null });
  }

  const admin = createAdminClient();

  // 自分のメンバーシップ（org + store）を取得
  const { data: myMemberships } = await admin
    .from("memberships")
    .select("organization_id, store_id")
    .eq("user_id", session.user.id);

  if (!myMemberships || myMemberships.length === 0) {
    return NextResponse.json({ books: [], organizationId: null });
  }

  const orgIds = [...new Set(myMemberships.map((m) => m.organization_id))];
  const storeIds = [...new Set(myMemberships.map((m) => m.store_id))];

  // 同じ校舎にいる全ユーザーのIDを取得
  const { data: storeMemberships } = await admin
    .from("memberships")
    .select("user_id")
    .in("store_id", storeIds);

  const coworkerIds = [...new Set((storeMemberships ?? []).map((m) => m.user_id))];

  // 自分の組織の教材 OR 同じ校舎のメンバーが作成した教材
  const orgIdList = orgIds.join(",");
  const userIdList = coworkerIds.join(",");
  const { data: books } = await admin
    .from("books")
    .select("*")
    .or(`organization_id.in.(${orgIdList}),creator_user_id.in.(${userIdList})`)
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

  return NextResponse.json({ books: mapped, organizationId: orgIds[0] });
}
