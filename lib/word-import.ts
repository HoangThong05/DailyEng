/**
 * Tách khối văn bản người dùng dán vào thành danh sách từ.
 *
 * Mỗi dòng một từ. Không bắt buộc một dấu phân cách duy nhất, vì người dùng
 * hay dán từ nhiều nguồn: Google Sheets/Excel cho ra tab, Quizlet cho ra
 * `word - nghĩa`, tự gõ thì `word = nghĩa` hay `word: nghĩa`.
 */

export type ParsedWord = { term: string; meaning: string };

export type ParseResult = {
  words: ParsedWord[];
  /** Số thứ tự (bắt đầu từ 1) của các dòng không tách được. */
  badLines: number[];
};

/**
 * Thứ tự ưu tiên khi một dòng chứa nhiều ký hiệu.
 * Tab đứng đầu vì bảng tính không bao giờ cho ra tab trong nội dung ô.
 * Dấu phẩy để cuối vì nghĩa tiếng Việt hay có phẩy ("vội, gấp").
 */
const SEPARATORS = ["\t", "=", " - ", " – ", " — ", ":", ","] as const;

/** Bỏ số thứ tự đầu dòng kiểu "1. " hoặc "1) " khi dán từ danh sách có đánh số. */
const LEADING_NUMBER = /^\d+[.)]\s+/;

function splitLine(line: string): ParsedWord | null {
  for (const separator of SEPARATORS) {
    const index = line.indexOf(separator);
    if (index < 0) continue;

    const term = line.slice(0, index).trim();
    const meaning = line.slice(index + separator.length).trim();
    if (term && meaning) return { term, meaning };
  }
  return null;
}

export function parseWords(raw: string): ParseResult {
  const words: ParsedWord[] = [];
  const badLines: number[] = [];

  raw.split(/\r?\n/).forEach((line, position) => {
    const trimmed = line.trim().replace(LEADING_NUMBER, "");
    if (!trimmed) return;

    const parsed = splitLine(trimmed);
    if (parsed) words.push(parsed);
    else badLines.push(position + 1);
  });

  return { words, badLines };
}

/**
 * Tìm từ bị lặp trong danh sách (không phân biệt hoa thường), kèm những từ đã
 * có sẵn trong bộ. Bảng words có ràng buộc unique (deck_id, term) nên phải
 * chặn trước, không thì cả câu insert bị từ chối với lỗi Postgres khó hiểu.
 */
export function findDuplicates(
  words: ParsedWord[],
  existingTerms: Iterable<string> = [],
): { repeated: string[]; existing: string[] } {
  const known = new Set<string>();
  for (const term of existingTerms) known.add(term.toLowerCase());

  const seen = new Set<string>();
  const repeated = new Set<string>();
  const existing = new Set<string>();

  for (const word of words) {
    const key = word.term.toLowerCase();
    if (known.has(key)) existing.add(word.term);
    else if (seen.has(key)) repeated.add(word.term);
    else seen.add(key);
  }

  return { repeated: [...repeated], existing: [...existing] };
}

/** Câu mô tả cách viết, dùng chung cho các form để không lệch nhau. */
export const FORMAT_HINT =
  "Mỗi dòng một từ: word = nghĩa. Dán từ Excel/Google Sheets hay Quizlet cũng được.";
