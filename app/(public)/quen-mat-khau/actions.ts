"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { RESET_PATH, VERIFY_PATH } from "@/lib/supabase/proxy";
import { createClient } from "@/lib/supabase/server";

export type ForgotState = {
  error?: string;
};

async function siteOrigin() {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) return origin;

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "";
}

function toVietnamese(error: AuthError) {
  switch (error.code) {
    case "over_email_send_rate_limit":
      return "Gửi email quá nhiều lần. Đợi một phút rồi thử lại.";
    case "validation_failed":
      return "Email không hợp lệ.";
    default:
      return error.message;
  }
}

/**
 * Gửi mã khôi phục mật khẩu.
 *
 * Email "Reset Password" của Supabase phải có `{{ .Token }}` để người dùng
 * nhập mã 6 số ở /nhap-ma; link trong mail (nếu còn) đưa thẳng tới
 * /auth/xac-nhan rồi sang trang đặt mật khẩu mới.
 */
export async function sendResetCode(email: string) {
  const supabase = await createClient();
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/xac-nhan?next=${RESET_PATH}`,
  });
}

export async function requestReset(
  _prevState: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Nhập email bạn đã đăng ký giúp mình." };

  const { error } = await sendResetCode(email);
  if (error) return { error: toVietnamese(error) };

  // Không tiết lộ email có tài khoản hay không: cứ sang màn nhập mã.
  redirect(`${VERIFY_PATH}?email=${encodeURIComponent(email)}&loai=khoi-phuc`);
}
