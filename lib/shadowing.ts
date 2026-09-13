/**
 * Chấm shadowing: máy nghe được gì so với câu mẫu.
 * Cùng giới hạn như luyện phát âm từ đơn (xem lib/pronunciation.ts): chỉ đo
 * "máy có nhận ra đúng từ không", không đo ngữ điệu hay trọng âm.
 */
import { gradeAgainst, type TokenMark } from "@/lib/dictation-game";
import type { Alternative, Verdict } from "@/lib/pronunciation";

export type ShadowAttempt = {
  /** 0..100 = % từ trong câu mẫu mà máy nghe ra. */
  score: number;
  verdict: Verdict;
  heard: string;
  marks: TokenMark[];
};

/** Điểm đạt để tính là nhớ từ khoá (ghi Leitner). */
export const SHADOW_PASS = 70;

/**
 * Thử mọi phương án máy trả về, lấy phương án khớp câu mẫu nhất — máy hay xếp
 * câu đúng ở phương án 2, 3 khi giọng chưa rõ.
 */
export function assessShadowing(
  sentence: string,
  term: string,
  alternatives: Alternative[],
): ShadowAttempt {
  let best: ShadowAttempt | null = null;

  for (const alternative of alternatives) {
    const grade = gradeAgainst(alternative.transcript, sentence, term);
    const score = Math.round(grade.accuracy * 100);
    if (!best || score > best.score) {
      best = {
        score,
        verdict: score >= 85 ? "good" : score >= 55 ? "close" : "off",
        heard: alternative.transcript,
        marks: grade.marks,
      };
    }
  }

  return (
    best ?? {
      score: 0,
      verdict: "off",
      heard: "",
      marks: sentence.split(/\s+/).map((text) => ({ text, hit: false })),
    }
  );
}
