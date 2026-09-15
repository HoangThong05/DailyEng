"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";

export type FeedbackState = { error?: string; sent?: boolean };

const MIN = 5;
const MAX = 2000;

/** Lưu góp ý vào bảng feedback; ai cũng gửi được, không cần đăng nhập. */
export async function sendFeedback(
  _prev: FeedbackState,
  formData: FormData,
): Promise<FeedbackState> {
  const message = String(formData.get("message") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const page = String(formData.get("page") ?? "").trim().slice(0, 200);

  if (message.length < MIN) return { error: "Viết thêm vài chữ nữa nhé." };
  if (message.length > MAX) return { error: `Tối đa ${MAX} ký tự.` };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Email không đúng định dạng." };
  }

  const user = await getCurrentUser();
  const supabase = await createClient();
  const { error } = await supabase.from("feedback").insert({
    user_id: user?.id ?? null,
    email: email || user?.email || null,
    message,
    page: page || null,
  });

  if (error) {
    console.error("feedback:", error.message);
    return { error: "Chưa gửi được, thử lại sau nhé." };
  }
  return { sent: true };
}
