/**
 * Hệ Leitner 5 hộp.
 *
 * Nhớ được  → lên hộp cao hơn, khoảng cách ôn dài ra.
 * Không nhớ → rơi thẳng về hộp 1, ôn lại ngay trong ngày.
 */

/** Số ngày chờ trước khi ôn lại, theo hộp 1..5. */
export const BOX_INTERVAL_DAYS = [1, 2, 4, 7, 14] as const;
export const MAX_BOX = BOX_INTERVAL_DAYS.length;

/**
 * App dùng múi giờ Việt Nam để tính "hôm nay", không dùng UTC.
 * Học lúc 1h sáng ở VN thì UTC vẫn đang là hôm qua — lấy UTC sẽ lệch một ngày.
 */
export const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** Ngày hôm nay theo giờ VN, dạng YYYY-MM-DD. */
export function todayInAppZone(now: Date = new Date()): string {
  // Locale en-CA cho ra đúng định dạng YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Giờ hiện tại theo giờ VN, 0–23. */
export function hourInAppZone(now: Date = new Date()): number {
  const text = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return Number(text);
}

/** Cộng ngày vào chuỗi YYYY-MM-DD, tính bằng UTC nên không dính lệch múi giờ. */
export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Mốc 00:00 hôm nay theo giờ VN, trả về ISO để so với cột timestamptz.
 * Việt Nam không có giờ mùa hè nên +07:00 luôn đúng.
 */
export function startOfTodayIso(today: string = todayInAppZone()): string {
  return new Date(`${today}T00:00:00+07:00`).toISOString();
}

export type ReviewState = { box: number; dueOn: string };

/** Hộp và hạn ôn tiếp theo, chưa xét tới chuyện từ đã đến hạn hay chưa. */
export function reviewOutcome(
  currentBox: number,
  remembered: boolean,
  today: string = todayInAppZone(),
): ReviewState {
  if (!remembered) {
    // Về hộp 1 và đến hạn ngay, để còn gặp lại trong phiên học hôm nay.
    return { box: 1, dueOn: today };
  }

  const box = Math.min(currentBox + 1, MAX_BOX);
  return { box, dueOn: addDays(today, BOX_INTERVAL_DAYS[box - 1]) };
}

/**
 * Trạng thái mới sau một lần trả lời, có tôn trọng lịch giãn cách.
 *
 * Quiz bốc từ ngẫu nhiên trong bộ, không lọc theo hạn ôn như flashcard. Nếu
 * lần đúng nào cũng đẩy lên hộp thì làm quiz vài lượt liên tiếp trong một buổi
 * là tống được một từ lên hộp 5 — đúng thứ mà giãn cách sinh ra để ngăn.
 *
 * Quy tắc:
 *  - Trả lời sai  → luôn rơi về hộp 1, kể cả từ chưa tới hạn. Sai là bằng
 *    chứng chưa thuộc, không có lý do bỏ qua.
 *  - Đúng, đã tới hạn  → lên hộp như bình thường.
 *  - Đúng, chưa tới hạn → giữ nguyên hộp và hạn. Lượt này vẫn được ghi nhật ký
 *    nên vẫn tính vào thống kê và chuỗi ngày, chỉ không đẩy tiến độ.
 *
 * @param current Tiến độ hiện có; null nghĩa là từ mới, luôn coi như đã tới hạn.
 */
export function nextReviewState(
  current: ReviewState | null,
  remembered: boolean,
  today: string = todayInAppZone(),
): ReviewState {
  if (!remembered) return { box: 1, dueOn: today };

  if (current === null) return reviewOutcome(1, true, today);

  const isDue = current.dueOn <= today;
  return isDue ? reviewOutcome(current.box, true, today) : current;
}