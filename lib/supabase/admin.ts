import { createClient } from "@supabase/supabase-js";

/** RLSをバイパスするサーバー専用クライアント。Server ActionsやRoute Handlersでのみ使用 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );
}
