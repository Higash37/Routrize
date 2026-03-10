import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ organizationId: null, storeId: null, role: null });
  }

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
