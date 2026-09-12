/**
 * Phần thuần logic của trò Nghe & gõ. Không import gì phía server.
 */

/** Số từ mỗi lượt chơi. */
export const DICTATION_SIZE = 10;

export type DictationWord = {
  wordId: string;
  term: string;
  meaning: string;
  phonetic: string | null;
};

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
