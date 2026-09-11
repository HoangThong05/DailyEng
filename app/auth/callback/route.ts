import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Đích quay về sau khi đăng nhập bằng nhà cung cấp bên ngoài (Google).
 *
 * Google → Supabase → về đây kèm ?code. Đổi code lấy phiên đăng nhập, việc này
 * cần chuỗi bí mật PKCE đã được ghi vào cookie lúc bấm nút ở /dang-nhap.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  // Người dùng bấm Huỷ ở màn hình Google, hoặc Google từ chối.
  if (searchParams.get("error")) {
    return NextResponse.redirect(`${origin}/dang-nhap?loi=google`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/`);
  }

  return NextResponse.redirect(`${origin}/dang-nhap?loi=google`);
}