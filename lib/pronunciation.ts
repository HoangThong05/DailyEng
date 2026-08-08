/**
 * Chấm điểm phát âm bằng cách so chuỗi máy nghe được với từ gốc.
 *
 * Đây không phải chấm điểm ngữ âm thật — trình duyệt chỉ trả về văn bản, không
 * trả về âm vị. Nói lệch tới mức máy nhận ra từ khác thì điểm mới tụt. Đủ dùng
 * để biết mình có phát âm ra hồn hay không, nhưng đừng kỳ vọng nó bắt được
 * trọng âm hay nguyên âm dài ngắn.
 *
 * Module cố ý không phụ thuộc gì để kiểm thử được độc lập.
 */

export type Verdict = "good" | "close" | "off";

export type Attempt = {
  score: number;
  verdict: Verdict;
};

/** Bỏ dấu câu, gộp khoảng trắng, về chữ thường. */
export function normalizeSpoken(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Khoảng cách Levenshtein, dùng một hàng đệm cho gọn bộ nhớ. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1, // chèn
        previous[j] + 1, // xoá
        previous[j - 1] + cost, // thay
      );
    }
    previous = current;
  }

  return previous[b.length];
}

const GOOD_THRESHOLD = 85;
const CLOSE_THRESHOLD = 55;

export function scoreAttempt(term: string, transcript: string): Attempt {
  const target = normalizeSpoken(term);
  const said = normalizeSpoken(transcript);

  if (!target || !said) return { score: 0, verdict: "off" };
  if (target === said) return { score: 100, verdict: "good" };

  const distance = levenshtein(target, said);
  const longest = Math.max(target.length, said.length);
  const score = Math.max(0, Math.round((1 - distance / longest) * 100));

  return {
    score,
    verdict:
      score >= GOOD_THRESHOLD
        ? "good"
        : score >= CLOSE_THRESHOLD
          ? "close"
          : "off",
  };
}