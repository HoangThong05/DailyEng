/**
 * Phần thuần logic của các trò gõ chữ (Nghe & gõ, Mưa từ vựng).
 * Không import gì phía server.
 */

/** Số từ mỗi lượt Nghe & gõ. */
export const DICTATION_SIZE = 10;
/** Số từ mỗi ván Mưa từ vựng. */
export const RAIN_SIZE = 25;
/** Số lần để từ rơi chạm đáy trước khi thua. */
export const RAIN_LIVES = 3;

export type GameWord = {
  wordId: string;
  term: string;
  meaning: string;
  phonetic: string | null;
  /** Vị trí ngang (%) khi rơi, chọn sẵn ở server để client không lệch. */
  left: number;
};

export type DictationWord = GameWord;

/** Giây để một giọt rơi hết màn; nhanh dần theo số từ đã rơi. */
export function fallDuration(index: number) {
  return Math.max(6.5, 12 - index * 0.22);
}

/** Mili giây chờ trước khi thả giọt tiếp theo. */
export function spawnDelay(index: number) {
  return Math.max(1900, 3200 - index * 55);
}

/**
 * So sánh câu trả lời với từ gốc một cách dễ tính: bỏ hoa/thường, khoảng
 * trắng thừa và dấu câu. "Ice-cream" vẫn khớp "ice cream".
 */
export function normalizeAnswer(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isCorrectAnswer(answer: string, term: string) {
  return normalizeAnswer(answer) === normalizeAnswer(term);
}
