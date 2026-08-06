import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "./env";

/**
 * Client Supabase dùng trong Server Component, Server Action và Route Handler.
 * Phải tạo mới cho mỗi request — tuyệt đối không dùng chung giữa các request.
 */
export async function createClient() {
  // Phải đọc cookie TRƯỚC khi kiểm tra env: chính lệnh này báo cho Next biết
  // route là dynamic. Nếu ném lỗi thiếu env trước, Next sẽ tưởng route tĩnh và
  // build đổ ở bước prerender.
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component không được phép ghi cookie. Bỏ qua an toàn vì
          // proxy.ts đã làm việc refresh token trước khi request tới đây.
        }
      },
    },
  });
}

/** Lấy user đang đăng nhập, hoặc null. Đã xác thực JWT nên tin được. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) return null;

  return {
    id: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
  };
}
