import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Đích đến của link xác nhận trong email.
 *
 * Supabase có hai kiểu link tuỳ cấu hình email template:
 *  - PKCE: trả về ?code=...        → đổi lấy session
 *  - OTP:  trả về ?token_hash&type → xác thực bằng verifyOtp
 * Xử lý cả hai cho chắc.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Link khôi phục mật khẩu mang ?next=/doi-mat-khau; chỉ nhận đường dẫn
  // nội bộ để không bị lợi dụng chuyển hướng ra ngoài.
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  const failed = new URL("/dang-nhap", origin);
  failed.searchParams.set("loi", "xac-nhan");
  return NextResponse.redirect(failed);
}
