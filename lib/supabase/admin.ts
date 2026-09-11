import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "./env";

/**
 * Client chạy bằng service role — BỎ QUA toàn bộ RLS.
 *
 * Chỉ dùng ở chỗ thật sự cần đọc dữ liệu của nhiều người cùng lúc mà không
 * có ai đang đăng nhập (cron gửi thông báo). Tuyệt đối không import vào
 * Server Component hay Server Action phục vụ người dùng.
 */
export function createAdminClient() {
  const { url } = getSupabaseEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      "Thiếu SUPABASE_SERVICE_ROLE_KEY. Lấy ở Supabase → Project Settings → API keys.",
    );
  }

  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
