"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";

/** Lưu một lần làm mock test. Điểm cao nhất/lịch sử đọc lại từ bảng này. */
export async function saveMockResult(
  score: number,
  total: number,
  seconds: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Phiên đăng nhập đã hết hạn." };

  const supabase = await createClient();
  const { error } = await supabase.from("mock_results").insert({
    user_id: user.id,
    kind: "toeic-part5",
    score: Math.max(0, Math.min(total, Math.round(score))),
    total: Math.round(total),
    seconds: Math.max(0, Math.round(seconds)),
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}
