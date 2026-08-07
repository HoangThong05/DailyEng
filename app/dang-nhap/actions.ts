"use server";

import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { VERIFY_PATH } from "@/lib/supabase/proxy";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
};

/** Chỉ cho phép quay về đường dẫn nội bộ, chặn open redirect ra ngoài. */
function safeRedirect(target: string) {
  if (!target.startsWith("/") || target.startsWith("//")) return "/";
  return target;
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
