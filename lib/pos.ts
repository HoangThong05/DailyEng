/**
 * Loại từ ghi ở cuối nghĩa tiếng Việt, ví dụ "ước tính (v)" hay
 * "đó, kia; rằng (pron, conj)". Tách ra để hiện thành nhãn riêng trên thẻ.
 */
const LABELS: Record<string, string> = {
  n: "Danh từ",
  v: "Động từ",
  adj: "Tính từ",
  adv: "Trạng từ",
  prep: "Giới từ",
  conj: "Liên từ",
  pron: "Đại từ",
  det: "Hạn định từ",
  art: "Mạo từ",
  num: "Số từ",
  aux: "Trợ động từ",
  interj: "Thán từ",
  phr: "Cụm từ",
  phrase: "Cụm từ",
  "phr v": "Cụm động từ",
  "phrasal verb": "Cụm động từ",
  idiom: "Thành ngữ",
  abbr: "Viết tắt",
};

const TAIL = /\s*\(([a-z][a-z .,/]*)\)\s*$/i;

export type ParsedMeaning = {
  /** Nghĩa đã bỏ phần loại từ. */
  meaning: string;
  /** Nhãn tiếng Việt, ví dụ "Danh từ · Động từ"; null nếu không nhận ra. */
  pos: string | null;
  /** Mã gốc, ví dụ "n" hay "pron, conj". */
  code: string | null;
};

export function parseMeaning(meaningVi: string): ParsedMeaning {
  const match = TAIL.exec(meaningVi);
  if (!match) return { meaning: meaningVi.trim(), pos: null, code: null };

  const code = match[1].trim().toLowerCase();
  const labels = code
    .split(/[,/]/)
    .map((part) => part.trim())
    .map((part) => LABELS[part] ?? LABELS[part.replace(/\./g, "")] ?? null)
    .filter((label): label is string => label !== null);

  // Không nhận ra mã nào thì giữ nguyên nghĩa để không mất thông tin.
  if (labels.length === 0) return { meaning: meaningVi.trim(), pos: null, code };

  return {
    meaning: meaningVi.slice(0, match.index).trim(),
    pos: [...new Set(labels)].join(" · "),
    code,
  };
}
