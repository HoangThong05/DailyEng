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

export type Verdict = "good" | "close" | "off";

export type Attempt = {
  /** Điểm cuối 0..100, đã gộp cả ba tín hiệu. */
  score: number;
  verdict: Verdict;
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

const GOOD_SCORE = 85;
const CLOSE_SCORE = 55;

/**
 * Từ đúng tụt xuống phương án sau nghĩa là máy phải mò mới ra — trừ điểm dần.
 * Hạng 1 giữ nguyên, hạng 2 còn 0.8, hạng 3 còn 0.67...
 */
function rankFactor(rank: number): number {
  return 1 / (1 + 0.25 * (rank - 1));
}

/**
 * Máy càng không chắc thì điểm càng giảm, nhưng chỉ giảm tới 0.6 để một lần
 * tin cậy thấp không xoá sạch điểm. confidence = 0 nghĩa là trình duyệt không
 * báo, khi đó không trừ gì cả.
 */
function confidenceFactor(confidence: number): number {
  return confidence === 0 ? 1 : 0.6 + 0.4 * confidence;
}

export function assessAttempt(
  term: string,
  alternatives: Alternative[],
): Attempt {
  const target = normalizeSpoken(term);
  const usable = alternatives.filter((item) => normalizeSpoken(item.transcript));

  if (!target || usable.length === 0) {
    return { score: 0, verdict: "off", heard: alternatives[0]?.transcript ?? "" };
  }

  // Tìm phương án khớp nhất; hoà thì lấy phương án đứng trước.
  let bestIndex = 0;
  let bestMatch = -1;
  usable.forEach((item, index) => {
    const match = similarity(target, normalizeSpoken(item.transcript));
    if (match > bestMatch) {
      bestMatch = match;
      bestIndex = index;
    }
  });

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        bestMatch *
          rankFactor(bestIndex + 1) *
          confidenceFactor(usable[bestIndex].confidence),
      ),
    ),
  );

  return {
    score,
    verdict: score >= GOOD_SCORE ? "good" : score >= CLOSE_SCORE ? "close" : "off",
    heard: usable[0].transcript,
  };
}