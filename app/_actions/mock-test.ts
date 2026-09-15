"use server";

import { nextReviewState, todayInAppZone } from "@/lib/leitner";
import { MOCK_KINDS, MOCK_LIMIT_SECONDS, type MockKind, verifyMockKey } from "@/lib/mock-test";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export type SubmitResult =
  | { ok: true; score: number; total: number }
  | { ok: false; error: string };

/**
 * Nộp bài: server kiểm chữ ký đề, tự chấm, lưu kết quả và ghi Leitner cho
 * các câu sinh từ bộ từ. Điểm không nhận từ client.
 */
export async function submitMockTest(
  token: string,
  picks: (number | null)[],
  seconds: number,
  kind: MockKind = "toeic-part5",
): Promise<SubmitResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Phiên đăng nhập đã hết hạn." };
  if (!MOCK_KINDS.includes(kind)) return { ok: false, error: "Loại đề không hợp lệ." };

  const key = verifyMockKey(token);
  if (!key || picks.length !== key.answers.length) {
    return { ok: false, error: "Đề không hợp lệ, hãy làm đề mới." };
  }

  const score = key.answers.filter((answer, i) => picks[i] === answer).length;
  const total = key.answers.length;
  const used = Math.max(0, Math.min(MOCK_LIMIT_SECONDS[kind], Math.round(seconds)));

  const supabase = await createClient();
  const { error } = await supabase.from("mock_results").insert({
    user_id: user.id,
    kind,
    score,
    total,
    seconds: used,
  });
  if (error) return { ok: false, error: error.message };

  // Câu sinh từ bộ từ: đúng = nhớ. Ghi giống recordReview nhưng gộp một lượt.
  const today = todayInAppZone();
  const reviews = key.wordIds
    .map((wordId, i) => ({ wordId, i }))
    .filter((entry): entry is { wordId: string; i: number } => !!entry.wordId && picks[entry.i] !== null);

  if (reviews.length > 0) {
    const { data: current } = await supabase
      .from("word_progress")
      .select("word_id, box, due_on, review_count, correct_count")
      .in(
        "word_id",
        reviews.map((r) => r.wordId),
      );
    const byWord = new Map((current ?? []).map((row) => [row.word_id, row]));

    const upserts = reviews.map(({ wordId, i }) => {
      const remembered = picks[i] === key.answers[i];
      const row = byWord.get(wordId);
      const { box, dueOn } = nextReviewState(
        row ? { box: row.box, dueOn: row.due_on } : null,
        remembered,
        today,
      );
      return {
        user_id: user.id,
        word_id: wordId,
        box,
        due_on: dueOn,
        review_count: (row?.review_count ?? 0) + 1,
        correct_count: (row?.correct_count ?? 0) + (remembered ? 1 : 0),
        last_reviewed_at: new Date().toISOString(),
      };
    });
    const logs = reviews.map(({ wordId, i }) => ({
      user_id: user.id,
      word_id: wordId,
      day: today,
      remembered: picks[i] === key.answers[i],
    }));

    await Promise.all([
      supabase.from("word_progress").upsert(upserts, { onConflict: "user_id,word_id" }),
      supabase.from("review_log").insert(logs),
    ]);
  }

  return { ok: true, score, total };
}
