/** DB行型 (snake_case) — Supabaseから返る生データの型 */

// ── 組織・サブスクリプション ──

export type OrganizationRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type SubscriptionPlan = "free" | "pro" | "team";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing";

export type SubscriptionRow = {
  id: string;
  organization_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  extra_stores: number;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

// ── 校舎・所属 ──

export type StoreRow = {
  id: string;
  organization_id: string;
  name: string;
  store_code: string;
  created_at: string;
  updated_at: string;
};

export type MembershipRole = "owner" | "admin" | "teacher";

export type MembershipRow = {
  id: string;
  user_id: string;
  organization_id: string;
  store_id: string;
  role: MembershipRole;
  created_at: string;
};

// ── 教材カタログ ──

export type BookVisibility = "private" | "public";

export type BookRow = {
  id: string;
  title: string;
  subject: string;
  target_grade: string;
  fields: string[];
  tags: string[];
  total_pages: number;
  cover_image_url: string | null;
  description: string;
  creator_user_id: string | null;
  organization_id: string | null;
  visibility: BookVisibility;
  published_at: string | null;
  usage_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
};

export type BookChapterRow = {
  id: string;
  book_id: string;
  sort_index: number;
  title: string;
  start_page: number;
  end_page: number;
  created_at: string;
};

export type BookSectionRow = {
  id: string;
  chapter_id: string;
  sort_index: number;
  title: string;
  start_page: number;
  end_page: number;
  created_at: string;
};

export type BookResourceType = "video" | "link" | "file";

export type BookResourceRow = {
  id: string;
  book_id: string;
  type: BookResourceType;
  url: string;
  title: string;
  sort_index: number;
  created_at: string;
};

export type OrgBookLibraryRow = {
  id: string;
  organization_id: string;
  book_id: string;
  added_by: string | null;
  added_at: string;
};

// ── ルート ──

export type RouteRow = {
  id: string;
  store_id: string;
  owner_user_id: string;
  title: string;
  start_date: string;
  months: number;
  is_template: boolean;
  created_at: string;
  updated_at: string;
};

export type RouteItemRow = {
  id: string;
  route_id: string;
  book_id: string;
  sort_index: number;
  color: string;
  start_date: string;
  end_date: string;
  target_rounds: number;
  difficulty: number;
  importance: number;
  memo: string;
  created_at: string;
  updated_at: string;
};

export type RouteSubtaskRow = {
  id: string;
  route_item_id: string;
  label: string;
  start_date: string;
  end_date: string;
  sort_index: number;
  created_at: string;
};

// ── 生徒 ──

export type StudentRow = {
  id: string;
  store_id: string;
  name: string;
  student_code: string;
  pin_hash: string;
  grade: string | null;
  school_name: string | null;
  target_school: string | null;
  current_deviation: number | null;
  created_at: string;
  updated_at: string;
};

export type StudentRouteRow = {
  id: string;
  student_id: string;
  route_id: string;
  start_date: string | null;
  created_at: string;
};

export type Understanding = "good" | "ok" | "bad";

export type StudyLogRow = {
  id: string;
  student_id: string;
  date: string;
  minutes: number;
  book_id: string;
  understanding: Understanding;
  note: string | null;
  created_at: string;
};
