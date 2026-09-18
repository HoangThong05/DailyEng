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

/** Số câu mỗi lượt Nghe chép câu. */
export const SENTENCE_SIZE = 8;

export type SentenceItem = {
  wordId: string;
  term: string;
  meaning: string;
  sentence: string;
  translation: string | null;
};

export type TokenMark = { text: string; hit: boolean };

/**
 * Chấm bài chép câu: so từng từ của câu gốc với câu gõ, thứ tự có thể lệch
 * chút (thiếu/thừa từ) nhờ căn theo chuỗi con chung dài nhất (LCS).
 * Trả về từng từ gốc kèm cờ đúng/sai, tỉ lệ đúng và từ khoá có trúng không.
 */
export function gradeSentence(answer: string, item: SentenceItem) {
  return gradeAgainst(answer, item.sentence, item.term);
}

/** Lõi chấm: câu gõ/nói `answer` so với `sentence`, kèm từ khoá `term`. */
export function gradeAgainst(answer: string, sentence: string, term: string) {
  const target = normalizeAnswer(sentence).split(" ").filter(Boolean);
  const typed = normalizeAnswer(answer).split(" ").filter(Boolean);

  // LCS theo bảng động; câu ví dụ ngắn (< 30 từ) nên không lo tốn.
  const n = target.length;
  const m = typed.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        target[i] === typed[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const hits = new Array<boolean>(n).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (target[i] === typed[j]) {
      hits[i] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }

  // Giữ nguyên chữ gốc (hoa/thường, dấu câu) để hiện lại, chỉ chấm theo bản chuẩn hoá.
  const originalTokens = sentence.split(/\s+/).filter(Boolean);
  const marks: TokenMark[] = originalTokens.map((text, index) => ({
    text,
    hit: hits[index] ?? false,
  }));

  const correctCount = hits.filter(Boolean).length;
  const accuracy = n > 0 ? correctCount / n : 0;

  // Từ khoá trong câu có thể ở dạng biến thể (approve → approved, approving).
  // Tìm những chữ trong câu gốc ứng với từ khoá, rồi xem người học có gõ trúng
  // đúng những chữ đó không. Không tìm thấy trong câu (bất quy tắc) thì so
  // trực tiếp với phần đã gõ.
  const termTokens = normalizeAnswer(term).split(" ").filter(Boolean);
  const termIndexes = target
    .map((token, index) => (termTokens.some((tt) => matchesTerm(token, tt)) ? index : -1))
    .filter((index) => index >= 0);
  const termHit =
    termIndexes.length > 0
      ? termIndexes.every((index) => hits[index])
      : termTokens.every((tt) => typed.some((token) => matchesTerm(token, tt)));

  return { marks, accuracy, termHit };
}

/**
 * `token` (chữ trong câu / chữ đã gõ) có phải là từ khoá `termToken` hay biến
 * thể của nó không: bằng nhau, hoặc cùng gốc và đuôi thêm không quá 4 ký tự
 * (work → works / worked / working; approve → approved / approving).
 * Từ khoá quá ngắn (≤ 3 chữ) chỉ nhận khớp hoàn toàn, kẻo "off" nhận "office".
 */
function matchesTerm(token: string, termToken: string) {
  if (token === termToken) return true;
  if (termToken.length <= 3) return false;
  const base = termToken.endsWith("e") ? termToken.slice(0, -1) : termToken;
  return token.startsWith(base) && token.length - base.length <= 4;
}

/** Đạt khi gõ đúng từ khoá và ít nhất 70% câu. */
export function passesSentence(grade: { accuracy: number; termHit: boolean }) {
  return grade.termHit && grade.accuracy >= 0.7;
}
