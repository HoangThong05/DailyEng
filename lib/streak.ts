/**
 * Tính chuỗi ngày học liên tiếp.
 *
 * Module này cố ý không phụ thuộc gì cả — chỉ nhận vào chuỗi ngày dạng
 * YYYY-MM-DD — nên chạy và kiểm thử được độc lập.
 */

export type StreakInfo = {
  current: number;
  longest: number;
};

const DAY_MS = 86_400_000;

function toUtcMs(isoDay: string): number {
  const [year, month, day] = isoDay.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/** Số ngày từ `from` tới `to`. Dùng UTC nên tự xử lý đúng cuối tháng, năm nhuận. */
function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

/**
 * Chuỗi hiện tại vẫn được tính là còn sống nếu ngày học gần nhất là hôm nay
 * HOẶC hôm qua — nếu bắt buộc phải có hôm nay thì mỗi sáng mở app ai cũng
 * thấy chuỗi về 0, dù tối qua vừa học xong.
 *
 * @param days Danh sách ngày, không cần sắp xếp hay lọc trùng.
 */
export function computeStreak(days: string[], today: string): StreakInfo {
  const unique = [...new Set(days)].sort();
  if (unique.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;

  for (let i = 1; i < unique.length; i++) {
    run = daysBetween(unique[i - 1], unique[i]) === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  // Nghỉ quá một ngày là chuỗi đứt. Ngày ở tương lai coi như dữ liệu hỏng.
  const gap = daysBetween(unique[unique.length - 1], today);
  if (gap < 0 || gap > 1) return { current: 0, longest };

  let current = 1;
  for (let i = unique.length - 1; i > 0; i--) {
    if (daysBetween(unique[i - 1], unique[i]) !== 1) break;
    current += 1;
  }

  return { current, longest };
}