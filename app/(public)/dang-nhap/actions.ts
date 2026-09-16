"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { LOGIN_PATH, VERIFY_PATH } from "@/lib/supabase/proxy";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
};

/** Chỉ cho phép quay về đường dẫn nội bộ, chặn open redirect ra ngoài. */
function safeRedirect(target: string) {
  if (!target.startsWith("/") || target.startsWith("//")) return "/";
  return target;
}

/**
 * Địa chỉ gốc của bản đang chạy, để Google biết quay về đâu.
 * Lấy từ header thay vì hằng số nên localhost và bản deploy đều đúng.
 */
async function siteOrigin() {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) return origin;

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "";
}

function verifyUrl(email: string) {
  return `${VERIFY_PATH}?email=${encodeURIComponent(email)}`;
}

function toVietnamese(error: AuthError) {
  switch (error.code) {
    case "invalid_credentials":
      return "Email hoặc mật khẩu không đúng.";
    case "user_already_exists":
      return "Email này đã có tài khoản. Bạn thử đăng nhập xem.";
    case "weak_password":
      return "Mật khẩu quá yếu, đặt dài ít nhất 6 ký tự nhé.";
    case "over_email_send_rate_limit":
      return "Gửi email quá nhiều lần. Đợi một phút rồi thử lại.";
    case "validation_failed":
      return "Email hoặc mật khẩu không hợp lệ.";
    default:
      return error.message;
  }
}

/**
 * Bắt đầu đăng nhập bằng Google.
 *
 * Gọi ở server nên signInWithOAuth không tự chuyển trang mà trả về URL của
 * Google — ta tự redirect. Chuỗi bí mật PKCE được ghi vào cookie ngay tại đây,
 * nhờ vậy /auth/callback đọc lại được để đổi lấy phiên đăng nhập.
 */
export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteOrigin()}/auth/callback` },
  });

  if (error || !data.url) redirect(`${LOGIN_PATH}?loi=google`);

  redirect(data.url);
}

/**
 * Đăng nhập bằng ID token của Google (luồng Google Identity Services).
 *
 * Token do trình duyệt lấy trực tiếp từ Google trên tên miền của app, nên
 * người dùng không bị chuyển hướng qua địa chỉ dự án Supabase. `nonce` là
 * chuỗi gốc; Google nhận bản băm SHA-256 của nó.
 */
export async function signInWithGoogleIdToken(
  token: string,
  nonce: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!token) return { ok: false, error: "Google không trả về thông tin đăng nhập." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token,
    nonce,
  });

  if (error) return { ok: false, error: toVietnamese(error) };
  return { ok: true };
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

  if (mode === "signup") {
    if (password.length < 6) {
      return { error: "Mật khẩu cần ít nhất 6 ký tự." };
    }
    // Kiểm lại ở server, vì kiểm tra phía client có thể bị bỏ qua.
    if (password !== String(formData.get("confirm") ?? "")) {
      return { error: "Hai mật khẩu chưa khớp nhau." };
    }
  }

  const supabase = await createClient();

  if (mode === "signin") {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Tài khoản có rồi nhưng chưa xác nhận: đưa thẳng sang màn nhập mã,
    // không thì người dùng kẹt ở đây mà chẳng biết làm gì tiếp.
    if (error?.code === "email_not_confirmed") redirect(verifyUrl(email));
    if (error) return { error: toVietnamese(error) };
  } else {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: toVietnamese(error) };

    // Bật xác nhận email thì chưa có session — sang màn nhập mã 6 số.
    if (!data.session) redirect(verifyUrl(email));
  }

  redirect(next);
}
