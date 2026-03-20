import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** 店舗のカリキュラム一覧を取得 */
export async function GET(request: NextRequest) {
  const storeId = request.nextUrl.searchParams.get("storeId");
  if (!storeId) return NextResponse.json({ routes: [] });

  const admin = createAdminClient();

  // ルート本体を取得
  const { data: routes } = await admin
    .from("routes")
    .select("*")
    .eq("store_id", storeId)
    .order("updated_at", { ascending: false });

  if (!routes || routes.length === 0) {
    return NextResponse.json({ routes: [] });
  }

  // ルートIDリスト
  const routeIds = routes.map((r) => r.id);

  // ルートアイテムを一括取得
  const { data: items } = await admin
    .from("route_items")
    .select("*")
    .in("route_id", routeIds)
    .order("sort_index", { ascending: true });

  // サブタスクを一括取得
  const itemIds = (items ?? []).map((i) => i.id);
  const { data: subtasks } = itemIds.length > 0
    ? await admin
        .from("route_subtasks")
        .select("*")
        .in("route_item_id", itemIds)
        .order("sort_index", { ascending: true })
    : { data: [] };

  // サブタスクをアイテムIDでグループ化
  const subtaskMap = new Map<string, typeof subtasks>();
  for (const st of subtasks ?? []) {
    const list = subtaskMap.get(st.route_item_id) ?? [];
    list.push(st);
    subtaskMap.set(st.route_item_id, list);
  }

  // アイテムをルートIDでグループ化 + camelCase変換
  const itemMap = new Map<string, unknown[]>();
  for (const item of items ?? []) {
    const list = itemMap.get(item.route_id) ?? [];
    list.push({
      id: item.id,
      bookId: item.book_id,
      title: item.title ?? "",
      subject: item.subject ?? "",
      fields: item.fields ?? [],
      color: item.color ?? "#60a5fa",
      targetGrade: item.target_grade ?? "",
      tags: item.tags ?? [],
      difficulty: item.difficulty ?? 3,
      importance: item.importance ?? 3,
      memo: item.memo ?? "",
      totalPages: item.total_pages ?? 0,
      chapters: [],
      targetRounds: item.target_rounds ?? 1,
      subtasks: (subtaskMap.get(item.id) ?? []).map((st) => ({
        id: st.id,
        label: st.label,
        startDate: st.start_date,
        endDate: st.end_date,
      })),
      coverImageUrl: item.cover_image_url ?? null,
      sortIndex: item.sort_index,
      startDate: item.start_date,
      endDate: item.end_date,
    });
    itemMap.set(item.route_id, list);
  }

  // オーナー情報を取得
  const ownerIds = [...new Set(routes.map((r) => r.owner_user_id))];
  const ownerMap = new Map<string, string>();
  for (const id of ownerIds) {
    const { data: { user } } = await admin.auth.admin.getUserById(id);
    if (user) ownerMap.set(id, user.email ?? "");
  }

  // ルートを組み立て
  const result = routes.map((r) => ({
    dbId: r.id,
    title: r.title,
    startDate: r.start_date,
    months: r.months,
    items: itemMap.get(r.id) ?? [],
    eventLanes: r.events ?? [],
    selectedItemId: null,
    ownerUserId: r.owner_user_id,
    ownerEmail: ownerMap.get(r.owner_user_id) ?? "",
    isTemplate: r.is_template,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  return NextResponse.json({ routes: result });
}

/** カリキュラムを保存（作成 or 更新） */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "未認証" }, { status: 401 });
  const user = session.user;

  const body = await request.json();
  const admin = createAdminClient();
  const now = new Date().toISOString();

  let routeId: string;

  if (body.dbId) {
    // 更新
    const { error } = await admin
      .from("routes")
      .update({
        title: body.title,
        start_date: body.startDate,
        months: body.months,
        events: body.eventLanes ?? [],
        updated_at: now,
      })
      .eq("id", body.dbId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    routeId = body.dbId;

    // 既存アイテム・サブタスクを削除して再挿入
    await admin.from("route_items").delete().eq("route_id", routeId);
  } else {
    // 新規
    const { data, error } = await admin
      .from("routes")
      .insert({
        store_id: body.storeId,
        owner_user_id: user.id,
        title: body.title,
        start_date: body.startDate,
        months: body.months,
        events: body.eventLanes ?? [],
        is_template: false,
      })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    routeId = data.id;
  }

  // アイテムを挿入
  const itemsToInsert = (body.items ?? []).map((item: Record<string, unknown>, i: number) => ({
    id: undefined, // DBで自動生成
    route_id: routeId,
    book_id: item.bookId ?? item.id,
    title: item.title ?? "",
    subject: item.subject ?? "",
    fields: item.fields ?? [],
    color: item.color ?? "#60a5fa",
    target_grade: item.targetGrade ?? "",
    tags: item.tags ?? [],
    sort_index: i,
    start_date: item.startDate,
    end_date: item.endDate,
    target_rounds: item.targetRounds ?? 1,
    difficulty: item.difficulty ?? 3,
    importance: item.importance ?? 3,
    memo: item.memo ?? "",
    total_pages: item.totalPages ?? 0,
    cover_image_url: item.coverImageUrl ?? null,
  }));

  if (itemsToInsert.length > 0) {
    const { data: insertedItems, error: itemError } = await admin
      .from("route_items")
      .insert(itemsToInsert)
      .select("id, sort_index");

    if (itemError) return NextResponse.json({ error: itemError.message }, { status: 500 });

    // サブタスクを挿入
    const allSubtasks: Record<string, unknown>[] = [];
    for (const inserted of insertedItems ?? []) {
      const originalItem = (body.items ?? [])[inserted.sort_index] as Record<string, unknown>;
      const subs = (originalItem?.subtasks ?? []) as Record<string, unknown>[];
      for (let j = 0; j < subs.length; j++) {
        allSubtasks.push({
          route_item_id: inserted.id,
          label: subs[j].label ?? "",
          start_date: subs[j].startDate,
          end_date: subs[j].endDate,
          sort_index: j,
        });
      }
    }

    if (allSubtasks.length > 0) {
      await admin.from("route_subtasks").insert(allSubtasks);
    }
  }

  return NextResponse.json({ id: routeId });
}

/** カリキュラムを削除 */
export async function DELETE(request: NextRequest) {
  const routeId = request.nextUrl.searchParams.get("id");
  if (!routeId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("routes").delete().eq("id", routeId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
