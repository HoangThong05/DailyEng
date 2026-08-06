"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  notice?: string;
};

/** Chỉ cho phép quay về đường dẫn nội bộ, chặn open redirect ra ngoài. */
function safeRedirect(target: string) {
  if (!target.startsWith("/") || target.startsWith("//")) return "/";
  return target;
}

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
    case "invalid_credentials":
      return "Email hoặc mật khẩu không đúng.";
    case "email_not_confirmed":
      return "Email chưa được xác nhận. Kiểm tra hộp thư giúp mình nhé.";
    case "user_already_exists":
      return "Email này đã có tài khoản. Bạn thử đăng nhập xem.";
    case "weak_password":
      return "Mật khẩu quá yếu, đặt dài ít nhất 6 ký tự nhé.";
    case "over_email_send_rate_limit":
      return "Gửi email quá nhiều lần. Đợi vài phút rồi thử lại.";
    case "validation_failed":
      return "Email hoặc mật khẩu không hợp lệ.";
    default:
      return error.message;
  }
}

export async function authenticate(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const mode = formData.get("mode") === "signup" ? "signup" : "signin";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeRedirect(String(formData.get("next") ?? "/"));

  if (!email || !password) {
    return { error: "Nhập đủ email và mật khẩu giúp mình nhé." };
  }

  if (mode === "signup" && password.length < 6) {
    return { error: "Mật khẩu cần ít nhất 6 ký tự." };
  }

  const supabase = await createClient();

  if (mode === "signin") {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: toVietnamese(error) };
  } else {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${await siteOrigin()}/auth/xac-nhan` },
    });
    if (error) return { error: toVietnamese(error) };

    // Nếu project bật xác nhận email thì chưa có session, phải chờ user bấm link.
    if (!data.session) {
      return {
        notice: `Đã gửi email xác nhận tới ${email}. Mở email và bấm vào link để kích hoạt tài khoản.`,
      };
    }
  }

  redirect(next);
}
