/**
 * Đánh giá một lần nói dựa trên kết quả nhận dạng giọng nói của trình duyệt.
 *
 * GIỚI HẠN, đọc kỹ trước khi tin con số:
 * Trình duyệt chỉ trả về VĂN BẢN, không trả về âm vị. Nên thứ đo được ở đây là
 * "máy có nhận ra đúng từ không", không phải "phát âm hay tới đâu". Nó không
 * biết bạn sai trọng âm hay nguyên âm dài ngắn. Muốn chấm tới từng âm vị phải
 * dùng dịch vụ chuyên biệt như Azure Pronunciation Assessment.
 *
 * Bù lại, ta khai thác cả ba tín hiệu mà API có:
 *  1. Độ khớp văn bản giữa từ gốc và chuỗi máy nghe được
 *  2. Từ đúng nằm ở phương án thứ mấy — máy đoán ra ngay hay phải mò
 *  3. Độ tin cậy trình duyệt tự báo
 *
 * Module cố ý không phụ thuộc gì để kiểm thử được độc lập.
 */

export type Alternative = {
  transcript: string;
  /** 0..1. Một số trình duyệt không báo, khi đó bằng 0. */
  confidence: number;
};

export type AttemptReason =
  /** Máy nhận ra ngay ở phương án đầu, tin cậy tốt. */
  | "exact"
  /** Đúng từ, nhưng máy phải mò xuống phương án sau hoặc không mấy chắc chắn. */
  | "guessed"
  /** Nghe ra thứ na ná, chưa thành từ đúng. */
  | "partial"
  /** Máy nghe thành từ khác hẳn. */
  | "mismatch";

export type Attempt = {
  reason: AttemptReason;
  /** Độ khớp văn bản 0..100 của phương án khớp nhất. */
  match: number;
  /** Từ đúng nằm ở phương án thứ mấy, đếm từ 1. */
  rank: number;
  /** Độ tin cậy của phương án khớp nhất; 0 nghĩa là trình duyệt không báo. */
  confidence: number;
  /** Phương án đầu tiên — thứ máy nghe thành. */
  heard: string;
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

/** Độ khớp hai chuỗi, 0..100. */
export function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 100;
  const longest = Math.max(a.length, b.length);
  return Math.max(0, Math.round((1 - levenshtein(a, b) / longest) * 100));
}

const GOOD_MATCH = 85;
const PARTIAL_MATCH = 55;
/** Dưới mức này coi như máy không chắc. Bằng 0 nghĩa là trình duyệt không báo. */
const CONFIDENCE_FLOOR = 0.5;

export function assessAttempt(
  term: string,
  alternatives: Alternative[],
): Attempt {
  const target = normalizeSpoken(term);
  const usable = alternatives.filter((item) => normalizeSpoken(item.transcript));

  if (!target || usable.length === 0) {
    return {
      reason: "mismatch",
      match: 0,
      rank: 0,
      confidence: 0,
      heard: alternatives[0]?.transcript ?? "",
    };
  }

  // Tìm phương án khớp nhất; hoà thì lấy phương án đứng trước.
  let bestIndex = 0;
  let bestMatch = -1;
  usable.forEach((item, index) => {
    const score = similarity(target, normalizeSpoken(item.transcript));
    if (score > bestMatch) {
      bestMatch = score;
      bestIndex = index;
    }
  });

  const best = usable[bestIndex];
  const confidence = best.confidence;
  // confidence = 0 nghĩa là không có thông tin, không nên vì thế mà trừ điểm.
  const confident = confidence === 0 || confidence >= CONFIDENCE_FLOOR;

  let reason: AttemptReason;
  if (bestMatch >= GOOD_MATCH) {
    reason = bestIndex === 0 && confident ? "exact" : "guessed";
  } else if (bestMatch >= PARTIAL_MATCH) {
    reason = "partial";
  } else {
    reason = "mismatch";
  }

  return {
    reason,
    match: bestMatch,
    rank: bestIndex + 1,
    confidence,
    heard: usable[0].transcript,
  };
}