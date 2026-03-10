import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** 組織の教材一覧を取得 */
export async function GET(request: NextRequest) {
  const orgId = request.nextUrl.searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ books: [] });

  const admin = createAdminClient();
  const { data: books } = await admin
    .from("books")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  // DB の snake_case → クライアントの camelCase に変換
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

  return NextResponse.json({ books: mapped });
}

/** 教材を作成 or 更新 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "未認証" }, { status: 401 });
  const user = session.user;

  const body = await request.json();
  const admin = createAdminClient();

  const row = {
    title: body.title,
    subject: body.subject ?? "",
    target_grade: body.targetGrade ?? "",
    fields: body.fields ?? [],
    tags: body.tags ?? [],
    total_pages: body.totalPages ?? 0,
    cover_image_url: body.coverImageUrl ?? null,
    description: body.description ?? "",
    organization_id: body.organizationId,
    creator_user_id: user.id,
    visibility: body.visibility ?? "private",
    published_at: body.publishedAt ?? null,
  };

  if (body.dbId) {
    // 更新
    const { error } = await admin
      .from("books")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("id", body.dbId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: body.dbId });
  } else {
    // 新規
    const { data, error } = await admin
      .from("books")
      .insert(row)
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data.id });
  }
}

/** 教材を削除 */
export async function DELETE(request: NextRequest) {
  const bookId = request.nextUrl.searchParams.get("id");
  if (!bookId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("books").delete().eq("id", bookId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
