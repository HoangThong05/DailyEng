"use server";

import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type PasswordState = {
  error?: string;
};

function toVietnamese(error: AuthError) {
  switch (error.code) {
    case "weak_password":
      return "Mật khẩu quá yếu, đặt dài ít nhất 6 ký tự nhé.";
    case "same_password":
      return "Mật khẩu mới trùng mật khẩu cũ. Đặt mật khẩu khác nhé.";
    case "session_expired":
    case "session_not_found":
      return "Phiên đã hết hạn. Bấm “Quên mật khẩu” để nhận mã mới.";
    default:
      return error.message;
  }
}

/** Đặt mật khẩu mới cho người đang đăng nhập (sau khi nhập mã khôi phục). */
export async function updatePassword(
  _prevState: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 6) return { error: "Mật khẩu cần ít nhất 6 ký tự." };
  if (password !== confirm) return { error: "Hai mật khẩu chưa khớp nhau." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: toVietnamese(error) };

  redirect("/");
}
