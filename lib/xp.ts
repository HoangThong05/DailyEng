/**
 * Điểm kinh nghiệm (XP) và cấp độ.
 *
 * XP không lưu riêng mà tính từ nhật ký học (review_log / study_days): mỗi
 * lượt trả lời là một mốc điểm cố định. Nhờ vậy không có chuyện cộng trùng,
 * và mọi hoạt động (flashcard, quiz, trò chơi) đều tự động có điểm.
 */

export const XP_REMEMBERED = 5;
export const XP_FORGOT = 1;
/**
 * Trần XP từ trả lời trong một ngày (≈60 lượt đúng). Quá mốc này vẫn được
 * ghi nhật ký, tính chuỗi và thống kê, chỉ không cộng thêm XP — để không
 * cày game một buổi là lên vài cấp. Đổi ở đây thì đổi cả hàm SQL (schema-19).
 */
export const DAILY_ANSWER_XP_CAP = 300;

export type LevelInfo = {
  level: number;
  title: string;
  /** XP đã tích trong cấp hiện tại. */
  current: number;
  /** XP cần để lên cấp kế tiếp. */
  needed: number;
  /** 0–100, để vẽ thanh. */
  percent: number;
  total: number;
};

const TITLES: [minLevel: number, title: string][] = [
  [1, "Người mới"],
  [3, "Học viên"],
  [6, "Chăm chỉ"],
  [10, "Cao thủ"],
  [15, "Bậc thầy"],
  [20, "Huyền thoại"],
];

export function xpForAnswers(correct: number, wrong: number) {
  return correct * XP_REMEMBERED + wrong * XP_FORGOT;
}

/** XP trả lời của một ngày, đã áp trần. */
export function dailyAnswerXp(correct: number, wrong: number) {
  return Math.min(DAILY_ANSWER_XP_CAP, xpForAnswers(correct, wrong));
}

/** Tổng XP cần có để đạt cấp `level`: 0, 200, 600, 1.200, 2.000, … (cấp 10: 9.000). */
export function xpToReach(level: number) {
  return 100 * (level - 1) * level;
}

export function titleForLevel(level: number) {
  let title = TITLES[0][1];
  for (const [min, name] of TITLES) if (level >= min) title = name;
  return title;
}

export function levelFromXp(total: number): LevelInfo {
  let level = 1;
  while (xpToReach(level + 1) <= total) level += 1;

  const floor = xpToReach(level);
  const ceiling = xpToReach(level + 1);
  const current = total - floor;
  const needed = ceiling - floor;

  return {
    level,
    title: titleForLevel(level),
    current,
    needed,
    percent: Math.min(100, Math.round((current / needed) * 100)),
    total,
  };
}
