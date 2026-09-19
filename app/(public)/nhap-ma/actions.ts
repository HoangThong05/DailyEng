"use server";

import { redirect } from "next/navigation";
import type { AuthError, EmailOtpType } from "@supabase/supabase-js";
import { sendResetCode } from "@/app/(public)/quen-mat-khau/actions";
import { RESET_PATH } from "@/lib/supabase/proxy";
import { createClient } from "@/lib/supabase/server";
import { readVerifyKind } from "./kind";

export type VerifyState = {
  error?: string;
  notice?: string;
};

function toVietnamese(error: AuthError) {
  switch (error.code) {
    case "otp_expired":
      return "Mã đã hết hạn hoặc không đúng. Bấm “Gửi lại mã” để nhận mã mới.";
    case "over_email_send_rate_limit":
      return "Gửi mã quá nhiều lần. Đợi một phút rồi thử lại.";
    case "validation_failed":
      return "Mã không hợp lệ.";
    default:
      return error.message;
  }
}

export async function verifyCode(
  _prevState: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("code") ?? "").trim();
  const kind = readVerifyKind(formData.get("kind"));

  if (!email) return { error: "Thiếu email, quay lại trang đăng ký giúp mình." };
  if (!/^\d{6}$/.test(token)) return { error: "Mã gồm đúng 6 chữ số." };

  const supabase = await createClient();

  // Mã trong mail "Confirm sign up" đi với type 'signup'; một số cấu hình lại
  // phát ra type 'email'. Thử lần lượt để khỏi phụ thuộc vào template.
  // Mã khôi phục mật khẩu đi với type 'recovery'; đúng mã thì đã có phiên
  // đăng nhập → sang trang đặt mật khẩu mới.
  const types: EmailOtpType[] = kind === "khoi-phuc" ? ["recovery"] : ["signup", "email"];
  const done = kind === "khoi-phuc" ? RESET_PATH : "/";
  let lastError: AuthError | null = null;

  for (const type of types) {
    const { error } = await supabase.auth.verifyOtp({ email, token, type });
    if (!error) redirect(done);
    lastError = error;
  }

  return { error: lastError ? toVietnamese(lastError) : "Xác nhận thất bại." };
}

export async function resendCode(
  _prevState: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const email = String(formData.get("email") ?? "").trim();
  const kind = readVerifyKind(formData.get("kind"));
  if (!email) return { error: "Thiếu email, quay lại trang đăng ký giúp mình." };

  const supabase = await createClient();
  const { error } =
    kind === "khoi-phuc"
      ? await sendResetCode(email)
      : await supabase.auth.resend({ type: "signup", email });

  if (error) return { error: toVietnamese(error) };

  return { notice: `Đã gửi mã mới tới ${email}.` };
}