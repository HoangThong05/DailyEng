import { describe, expect, it } from "vitest";
import {
  addDays,
  BOX_INTERVAL_DAYS,
  MAX_BOX,
  nextReviewState,
  reviewOutcome,
  todayInAppZone,
} from "@/lib/leitner";

const TODAY = "2026-09-16";

describe("addDays", () => {
  it("cộng và trừ ngày, qua cả ranh giới tháng", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2024-03-01", -1)).toBe("2024-02-29"); // năm nhuận
  });
});

describe("todayInAppZone", () => {
  it("dùng giờ Việt Nam, không phải UTC", () => {
    // 1h sáng 17/9 giờ VN = 18h ngày 16/9 UTC.
    expect(todayInAppZone(new Date("2026-09-16T18:00:00Z"))).toBe("2026-09-17");
  });
});

describe("reviewOutcome", () => {
  it("nhớ thì lên hộp và giãn theo bảng khoảng cách", () => {
    expect(reviewOutcome(1, true, TODAY)).toEqual({
      box: 2,
      dueOn: addDays(TODAY, BOX_INTERVAL_DAYS[1]),
    });
  });

  it("không vượt quá hộp cao nhất", () => {
    const result = reviewOutcome(MAX_BOX, true, TODAY);
    expect(result.box).toBe(MAX_BOX);
    expect(result.dueOn).toBe(addDays(TODAY, BOX_INTERVAL_DAYS[MAX_BOX - 1]));
  });

  it("quên thì về hộp 1 và tới hạn ngay hôm nay", () => {
    expect(reviewOutcome(4, false, TODAY)).toEqual({ box: 1, dueOn: TODAY });
  });
});

describe("nextReviewState", () => {
  it("từ mới coi như đã tới hạn", () => {
    expect(nextReviewState(null, true, TODAY).box).toBe(2);
  });

  it("đúng nhưng chưa tới hạn thì giữ nguyên tiến độ", () => {
    const current = { box: 3, dueOn: addDays(TODAY, 5) };
    expect(nextReviewState(current, true, TODAY)).toEqual(current);
  });

  it("đúng và đã tới hạn thì lên hộp", () => {
    const current = { box: 3, dueOn: TODAY };
    expect(nextReviewState(current, true, TODAY).box).toBe(4);
  });

  it("sai thì luôn về hộp 1, kể cả khi chưa tới hạn", () => {
    const current = { box: 5, dueOn: addDays(TODAY, 10) };
    expect(nextReviewState(current, false, TODAY)).toEqual({ box: 1, dueOn: TODAY });
  });
});
