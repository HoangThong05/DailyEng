import { describe, expect, it } from "vitest";
import { addDays, BOX_INTERVAL_DAYS, MAX_BOX, rateReview, ratingIntervals } from "@/lib/leitner";
import { parseMeaning } from "@/lib/pos";

const TODAY = "2026-09-18";

describe("rateReview", () => {
  const box3 = { box: 3, dueOn: TODAY };

  it("quên → hộp 1, tới hạn hôm nay, không tính nhớ", () => {
    expect(rateReview(box3, "again", TODAY)).toEqual({ box: 1, dueOn: TODAY, remembered: false });
  });

  it("khó → giữ hộp, gặp lại ngày mai", () => {
    expect(rateReview(box3, "hard", TODAY)).toEqual({
      box: 3,
      dueOn: addDays(TODAY, 1),
      remembered: true,
    });
  });

  it("nhớ → lên 1 hộp, giãn theo hộp mới", () => {
    expect(rateReview(box3, "good", TODAY)).toEqual({
      box: 4,
      dueOn: addDays(TODAY, BOX_INTERVAL_DAYS[3]),
      remembered: true,
    });
  });

  it("dễ → lên 2 hộp nhưng không vượt hộp cao nhất", () => {
    expect(rateReview(box3, "easy", TODAY).box).toBe(5);
    expect(rateReview({ box: 4, dueOn: TODAY }, "easy", TODAY).box).toBe(MAX_BOX);
  });

  it("thành thạo → hộp cao nhất", () => {
    const state = rateReview({ box: 1, dueOn: TODAY }, "master", TODAY);
    expect(state.box).toBe(MAX_BOX);
    expect(state.dueOn).toBe(addDays(TODAY, BOX_INTERVAL_DAYS[MAX_BOX - 1]));
  });

  it("từ mới (null) coi như hộp 1", () => {
    expect(rateReview(null, "good", TODAY).box).toBe(2);
  });

  it("áp dụng cả khi từ chưa tới hạn (khác nextReviewState)", () => {
    const notDue = { box: 2, dueOn: addDays(TODAY, 5) };
    expect(rateReview(notDue, "good", TODAY).box).toBe(3);
  });
});

describe("ratingIntervals", () => {
  it("số ngày tăng dần theo mức", () => {
    const days = ratingIntervals(2);
    expect(days.again).toBe(0);
    expect(days.hard).toBe(1);
    expect(days.good).toBe(BOX_INTERVAL_DAYS[2]);
    expect(days.easy).toBe(BOX_INTERVAL_DAYS[3]);
    expect(days.master).toBe(BOX_INTERVAL_DAYS[MAX_BOX - 1]);
    expect(days.hard).toBeLessThanOrEqual(days.good);
    expect(days.good).toBeLessThanOrEqual(days.easy);
  });
});

describe("parseMeaning", () => {
  it("tách loại từ đơn", () => {
    expect(parseMeaning("ước tính (v)")).toEqual({ meaning: "ước tính", pos: "Động từ", code: "v" });
  });

  it("nhiều loại từ cách nhau bằng phẩy", () => {
    const parsed = parseMeaning("đó, kia; rằng (pron, conj)");
    expect(parsed.meaning).toBe("đó, kia; rằng");
    expect(parsed.pos).toBe("Đại từ · Liên từ");
  });

  it("không có loại từ thì giữ nguyên", () => {
    expect(parseMeaning("anh chị em ruột")).toEqual({
      meaning: "anh chị em ruột",
      pos: null,
      code: null,
    });
  });

  it("mã lạ thì không cắt nghĩa", () => {
    const parsed = parseMeaning("cái gì đó (xyz)");
    expect(parsed.meaning).toBe("cái gì đó (xyz)");
    expect(parsed.pos).toBeNull();
  });
});
