"use server";

import type { ReviewSource } from "@/lib/database.types";
import { nextReviewState, rateReview, type Rating, todayInAppZone } from "@/lib/leitner";
import { getStudyStats } from "@/lib/stats";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export type ReviewResult = { ok: true } | { ok: false; error: string };

/**
 * Ghi lại một lần trả lời và đẩy từ sang hộp Leitner tiếp theo.
 * Dùng chung cho cả flashcard lẫn quiz — cả hai đều là một lần nhớ lại.
 *
 * Hộp hiện tại được đọc lại từ database chứ không nhận từ client, để client
 * không tự đặt được hộp tuỳ ý.
 */
export async function recordReview(
  wordId: string,
  remembered: boolean,
  /** Nguồn lượt trả lời, để nhiệm vụ ngày đếm riêng từng hoạt động. */
  source: ReviewSource = "hoc",
): Promise<ReviewResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Phiên đăng nhập đã hết hạn." };

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("word_progress")
    .select("box, due_on, review_count, correct_count")
    .eq("user_id", user.id)
    .eq("word_id", wordId)
    .maybeSingle();

  const today = todayInAppZone();
  const { box, dueOn } = nextReviewState(
    current ? { box: current.box, dueOn: current.due_on } : null,
    remembered,
    today,
  );

  const [progressResult, logResult] = await Promise.all([
    supabase.from("word_progress").upsert(
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
    ),
    // Nhật ký để tính chuỗi ngày và biểu đồ. Ghi thêm, không sửa.
    supabase.from("review_log").insert({
      user_id: user.id,
      word_id: wordId,
      day: today,
      remembered,
      source,
    }),
  ]);

  // Tiến độ quan trọng hơn nhật ký: hỏng nhật ký thì chỉ lệch thống kê,
  // nên chỉ báo lỗi khi chính word_progress ghi hụt.
  if (progressResult.error) {
    return { ok: false, error: progressResult.error.message };
  }
  if (logResult.error) {
    console.error("Không ghi được review_log:", logResult.error.message);
  }

  return { ok: true };
}

/**
 * Ghi một lần tự chấm ở chế độ Thẻ lật (quên / khó / nhớ / dễ / thành thạo).
 * Cùng bảng với recordReview, chỉ khác cách tính hộp — xem rateReview.
 */
export async function recordRating(
  wordId: string,
  rating: Rating,
): Promise<ReviewResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Phiên đăng nhập đã hết hạn." };

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("word_progress")
    .select("box, due_on, review_count, correct_count")
    .eq("user_id", user.id)
    .eq("word_id", wordId)
    .maybeSingle();

  const today = todayInAppZone();
  const { box, dueOn, remembered } = rateReview(
    current ? { box: current.box, dueOn: current.due_on } : null,
    rating,
    today,
  );

  const [progressResult, logResult] = await Promise.all([
    supabase.from("word_progress").upsert(
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
    ),
    supabase.from("review_log").insert({
      user_id: user.id,
      word_id: wordId,
      day: today,
      remembered,
      source: "hoc",
    }),
  ]);

  if (progressResult.error) return { ok: false, error: progressResult.error.message };
  if (logResult.error) console.error("Không ghi được review_log:", logResult.error.message);
  return { ok: true };
}

/*
 * Không revalidatePath khi kết thúc phiên: làm vậy Next render lại ngay trang
 * đang mở, server thấy bộ đã ôn xong nên thay màn kết quả bằng màn trống.
 * Các trang số liệu đều là dynamic (đọc cookie) nên khi chuyển sang đã tự
 * lấy dữ liệu mới, không cần làm mới thủ công.
 */

/**
 * Mốc hiện tại để màn kết quả quyết định có ăn mừng hay không.
 * Mốc đã ăn mừng lưu trong profile (server) nên đổi máy không ăn mừng lại.
 */
export async function getMilestones() {
  const supabase = await createClient();
  const [{ data: profile }, stats] = await Promise.all([
    supabase
      .from("profiles")
      .select("daily_goal, celebrated_goal_on, celebrated_level")
      .maybeSingle(),
    getStudyStats(),
  ]);
  const dailyGoal = profile?.daily_goal ?? 10;
  return {
    today: todayInAppZone(),
    dailyGoal,
    goalReached: stats.today.words >= dailyGoal,
    level: stats.level.level,
    title: stats.level.title,
    celebratedGoalOn: profile?.celebrated_goal_on ?? null,
    celebratedLevel: profile?.celebrated_level ?? 0,
  };
}

/** Ghi lại đã ăn mừng mốc nào, để không bung pháo lần hai. */
export async function markCelebrated(
  kind: "goal" | "level",
  value: string | number,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update(
      kind === "goal"
        ? { celebrated_goal_on: String(value) }
        : { celebrated_level: Number(value) },
    )
    .eq("id", user.id);
}
