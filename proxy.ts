import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next 16 đổi tên middleware thành proxy — file phải nằm cùng cấp với thư mục app.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Chạy trên mọi đường dẫn trừ:
     * - _next/static, _next/image: asset build
     * - sw.js, manifest.webmanifest, favicon, icon, ảnh: file tĩnh
     */
    "/((?!_next/static|_next/image|sw\\.js|manifest\\.webmanifest|favicon\\.ico|apple-icon|icon-|.*\\.(?:png|jpg|jpeg|gif|svg|webp)$).*)",
  ],
};
