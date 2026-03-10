import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  // getSession()はcookie読み取りのみで即座に完了
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ organizationId: null, storeId: null, role: null });
  }
  const user = session.user;

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("memberships")
    .select("organization_id, store_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    return NextResponse.json({ organizationId: null, storeId: null, role: null });
  }

  return NextResponse.json({
    organizationId: membership.organization_id,
    storeId: membership.store_id,
    role: membership.role,
  });
}
