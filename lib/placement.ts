import type { DeckCategory, DeckLevel, Json } from "@/lib/database.types";
import type { DeckSummary } from "@/lib/decks";

/**
 * Kiểm tra đầu vào: 20 câu trắc nghiệm từ → nghĩa, lấy từ cả ba mức của kho
 * bộ từ. Chấm ở client (không tính XP, không lên bảng xếp hạng), kết quả lưu
 * vào profiles.placement để trang Học gợi ý bộ nên bắt đầu.
 */

export const PLACEMENT_SIZE = 20;
export const OPTION_COUNT = 4;

/** Số câu mỗi mức; cộng lại bằng PLACEMENT_SIZE. */
export const LEVEL_QUOTA: Record<DeckLevel, number> = {
  beginner: 7,
  intermediate: 7,
  advanced: 6,
};

export const LEVELS: DeckLevel[] = ["beginner", "intermediate", "advanced"];

export const LEVEL_LABEL: Record<DeckLevel, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

/** Ngưỡng "đã vững" một mức. */
const PASS_RATE = 0.7;

export type PlacementQuestion = {
  wordId: string;
  term: string;
  phonetic: string | null;
  level: DeckLevel;
  options: string[];
  correctIndex: number;
};

export type PlacementGoal = DeckCategory | "chua-ro";

export const GOALS: { key: PlacementGoal; label: string; hint: string }[] = [
  { key: "toeic", label: "Thi TOEIC", hint: "Từ vựng theo chủ đề đề thi" },
  { key: "giao-tiep", label: "Giao tiếp", hint: "Nói chuyện hằng ngày, du lịch" },
  { key: "cong-viec", label: "Công việc", hint: "Email, họp, kinh doanh" },
  { key: "hoc-thuat", label: "Học thuật", hint: "Đọc tài liệu, IELTS, đại học" },
  { key: "cot-loi", label: "Nền tảng chung", hint: "Từ thông dụng nhất theo tần suất" },
  { key: "chua-ro", label: "Chưa rõ", hint: "Cứ gợi ý theo kết quả" },
];

export type PlacementResult = {
  level: DeckLevel;
  goal: PlacementGoal;
  /** Số câu đúng / tổng. */
  score: number;
  total: number;
  byLevel: Record<DeckLevel, { correct: number; total: number }>;
  takenAt: string;
};

/** Trộn mảng, không đụng mảng gốc. */
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Ước mức từ số câu đúng mỗi mức: vững cơ bản mới xét trung cấp, vững trung
 * cấp mới xét nâng cao. Mức trả về là mức NÊN HỌC (mức đầu tiên chưa vững).
 */
export function estimateLevel(byLevel: PlacementResult["byLevel"]): DeckLevel {
  for (const level of LEVELS) {
    const { correct, total } = byLevel[level];
    if (total === 0) continue;
    if (correct / total < PASS_RATE) return level;
  }
  return "advanced";
}

export function summarize(
  questions: PlacementQuestion[],
  answers: (number | null)[],
  goal: PlacementGoal,
): PlacementResult {
  const byLevel: PlacementResult["byLevel"] = {
    beginner: { correct: 0, total: 0 },
    intermediate: { correct: 0, total: 0 },
    advanced: { correct: 0, total: 0 },
  };
  questions.forEach((question, i) => {
    byLevel[question.level].total += 1;
    if (answers[i] === question.correctIndex) byLevel[question.level].correct += 1;
  });
  const score = LEVELS.reduce((sum, level) => sum + byLevel[level].correct, 0);
  return {
    level: estimateLevel(byLevel),
    goal,
    score,
    total: questions.length,
    byLevel,
    takenAt: new Date().toISOString(),
  };
}

/** Lời nhận xét ngắn theo mức nên học. */
export function verdictFor(level: DeckLevel, score: number, total: number) {
  const percent = Math.round((score / total) * 100);
  if (level === "beginner") {
    return {
      title: "Bắt đầu từ nền tảng",
      text: `Đúng ${percent}%. Nên học kỹ các bộ Cơ bản trước, mỗi ngày 10 từ là đủ.`,
    };
  }
  if (level === "intermediate") {
    return {
      title: "Nền tảng ổn, lên Trung cấp",
      text: `Đúng ${percent}%. Từ cơ bản đã vững, sang các bộ Trung cấp theo mục tiêu của bạn.`,
    };
  }
  return {
    title: "Vốn từ tốt, vào Nâng cao",
    text: `Đúng ${percent}%. Học các bộ Nâng cao và luyện kỹ năng (shadowing, mock test).`,
  };
}

/**
 * Gợi ý tối đa 3 bộ: đúng mức + đúng mục tiêu trước; thiếu thì lấy đúng mức ở
 * nhóm khác (ưu tiên Cốt lõi), rồi mới tới mức kề. Bỏ bộ tự tạo và bộ đã học hết.
 */
export function recommendDecks(
  decks: DeckSummary[],
  level: DeckLevel,
  goal: PlacementGoal,
  limit = 3,
): DeckSummary[] {
  const publicDecks = decks.filter((deck) => !deck.isOwn && deck.wordCount > 0);
  const picked: DeckSummary[] = [];
  const take = (predicate: (deck: DeckSummary) => boolean) => {
    for (const deck of publicDecks) {
      if (picked.length >= limit) return;
      if (!picked.includes(deck) && predicate(deck)) picked.push(deck);
    }
  };

  const neighbour: DeckLevel = level === "beginner" ? "intermediate" : level === "advanced" ? "intermediate" : "beginner";
  // Cốt lõi 1–2 toàn "the, a, of, and…" — ai qua được bài kiểm tra cũng biết
  // rồi, không gợi ý; muốn vẫn tự chọn ở danh sách.
  const tooBasic = (d: DeckSummary) => d.slug === "cot-loi-1" || d.slug === "cot-loi-2";

  if (goal !== "chua-ro") take((d) => d.level === level && d.category === goal);
  take((d) => d.level === level && d.category === "cot-loi" && !tooBasic(d));
  take((d) => d.level === level && !tooBasic(d));
  if (goal !== "chua-ro") take((d) => d.level === neighbour && d.category === goal);
  take((d) => d.level === neighbour);
  return picked;
}

/** Đọc profiles.placement; dữ liệu lạ thì coi như chưa làm. */
export function parsePlacement(value: Json | null | undefined): PlacementResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (!LEVELS.includes(v.level as DeckLevel)) return null;
  if (typeof v.score !== "number" || typeof v.total !== "number") return null;
  return v as unknown as PlacementResult;
}
