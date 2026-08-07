"use server";

import { revalidatePath } from "next/cache";
import { reviewOutcome } from "@/lib/leitner";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export type ReviewResult = { ok: true } | { ok: false; error: string };

/**
 * Ghi lại một lần trả lời thẻ và đẩy từ sang hộp Leitner tiếp theo.
 *
 * Hộp hiện tại được đọc lại từ database chứ không nhận từ client, để client
 * không tự đặt được hộp tuỳ ý.
 */
export async function recordReview(
  wordId: string,
  remembered: boolean,
): Promise<ReviewResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Phiên đăng nhập đã hết hạn." };

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("word_progress")
    .select("box, review_count, correct_count")
    .eq("user_id", user.id)
    .eq("word_id", wordId)
    .maybeSingle();

  const { box, dueOn } = reviewOutcome(current?.box ?? 1, remembered);

  const { error } = await supabase.from("word_progress").upsert(
    {
      user_id: user.id,
      word_id: wordId,
      box,
      due_on: dueOn,
      review_count: (current?.review_count ?? 0) + 1,
      correct_count: (current?.correct_count ?? 0) + (remembered ? 1 : 0),
      last_reviewed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,word_id" },
  );

  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

/** Gọi khi kết thúc phiên, để Home và danh sách bộ thẻ hiện số liệu mới. */
export async function refreshStudyViews() {
  revalidatePath("/");
  revalidatePath("/hoc");
}