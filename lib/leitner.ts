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
/* ---- Tự đánh giá 4 mức (chế độ Thẻ lật) ---------------------------------- */

/**
 * Người học tự chấm sau khi lật thẻ. Khác trả lời đúng/sai nhị phân ở học theo
 * chặng: có mức "khó" (nhớ nhưng chật vật) và "dễ" (nhớ ngay, nhảy hai hộp).
 */
export type Rating = "again" | "hard" | "good" | "easy" | "master";

export const RATINGS: Rating[] = ["again", "hard", "good", "easy"];

function clampBox(box: number) {
  return Math.max(1, Math.min(MAX_BOX, box));
}

/**
 * Trạng thái mới theo mức tự chấm. Áp dụng ngay cả khi từ chưa tới hạn —
 * người học đã chủ động ôn và tự đánh giá thì tôn trọng đánh giá đó.
 *
 *  - again : về hộp 1, tới hạn hôm nay (gặp lại ngay trong phiên)
 *  - hard  : giữ hộp, nhưng chỉ giãn 1 ngày
 *  - good  : lên 1 hộp, giãn theo hộp mới
 *  - easy  : lên 2 hộp, giãn theo hộp mới
 *  - master: nhảy thẳng hộp cao nhất
 */
export function rateReview(
  current: ReviewState | null,
  rating: Rating,
  today: string = todayInAppZone(),
): ReviewState & { remembered: boolean } {
  const box = current?.box ?? 1;
  switch (rating) {
    case "again":
      return { box: 1, dueOn: today, remembered: false };
    case "hard":
      return { box: clampBox(box), dueOn: addDays(today, 1), remembered: true };
    case "good": {
      const next = clampBox(box + 1);
      return { box: next, dueOn: addDays(today, BOX_INTERVAL_DAYS[next - 1]), remembered: true };
    }
    case "easy": {
      const next = clampBox(box + 2);
      return { box: next, dueOn: addDays(today, BOX_INTERVAL_DAYS[next - 1]), remembered: true };
    }
    case "master":
      return { box: MAX_BOX, dueOn: addDays(today, BOX_INTERVAL_DAYS[MAX_BOX - 1]), remembered: true };
  }
}

/** Số ngày tới lần gặp lại cho từng mức, để in dưới nút ("3 ngày"). */
export function ratingIntervals(box: number): Record<Rating, number> {
  const today = "2000-01-01";
  const days = (state: ReviewState) => {
    const [y, m, d] = state.dueOn.split("-").map(Number);
    return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2000, 0, 1)) / 86_400_000);
  };
  const current = { box, dueOn: today };
  return {
    again: 0,
    hard: days(rateReview(current, "hard", today)),
    good: days(rateReview(current, "good", today)),
    easy: days(rateReview(current, "easy", today)),
    master: days(rateReview(current, "master", today)),
  };
}
