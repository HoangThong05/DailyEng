import { describe, expect, it } from "vitest";
import {
  gradeAgainst,
  isCorrectAnswer,
  normalizeAnswer,
  passesSentence,
} from "@/lib/dictation-game";
import { computeStreak } from "@/lib/streak";

describe("normalizeAnswer", () => {
  it("bỏ dấu câu, gộp khoảng trắng, không phân biệt hoa thường", () => {
    expect(normalizeAnswer("  The  Book, please! ")).toBe("the book please");
  });
});

describe("isCorrectAnswer", () => {
  it("chấp nhận khác hoa thường và dấu câu thừa", () => {
    expect(isCorrectAnswer("Receipt.", "receipt")).toBe(true);
    expect(isCorrectAnswer(" take off ", "take off")).toBe(true);
  });

  it("từ khác thì sai", () => {
    expect(isCorrectAnswer("recipe", "receipt")).toBe(false);
  });
});

describe("gradeAgainst", () => {
  const sentence = "Please send me the invoice today.";

  it("gõ đúng hoàn toàn thì 100% và trúng từ khoá", () => {
    const grade = gradeAgainst(sentence, sentence, "invoice");
    expect(grade.accuracy).toBe(1);
    expect(grade.termHit).toBe(true);
    expect(passesSentence(grade)).toBe(true);
  });

  it("thiếu vài từ thì tỉ lệ giảm nhưng vẫn nhận ra từ khoá", () => {
    const grade = gradeAgainst("send me the invoice today", sentence, "invoice");
    expect(grade.accuracy).toBeGreaterThan(0.7);
    expect(grade.accuracy).toBeLessThan(1);
    expect(grade.termHit).toBe(true);
  });

  it("sai từ khoá thì không đạt dù chép gần đúng", () => {
    const grade = gradeAgainst("Please send me the invoce today", sentence, "invoice");
    expect(grade.termHit).toBe(false);
    expect(passesSentence(grade)).toBe(false);
  });

  it("bỏ trống thì 0%", () => {
    const grade = gradeAgainst("", sentence, "invoice");
    expect(grade.accuracy).toBe(0);
    expect(passesSentence(grade)).toBe(false);
  });
});

describe("computeStreak", () => {
  const today = "2026-09-16";

  it("chưa học ngày nào thì chuỗi bằng 0", () => {
    expect(computeStreak([], today)).toEqual({ current: 0, longest: 0 });
  });

  it("học liên tiếp tới hôm nay", () => {
    const days = ["2026-09-14", "2026-09-15", "2026-09-16"];
    expect(computeStreak(days, today)).toEqual({ current: 3, longest: 3 });
  });

  it("học tới hôm qua vẫn còn chuỗi", () => {
    expect(computeStreak(["2026-09-14", "2026-09-15"], today).current).toBe(2);
  });

  it("nghỉ quá một ngày là đứt chuỗi nhưng kỷ lục vẫn giữ", () => {
    const days = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-10"];
    expect(computeStreak(days, today)).toEqual({ current: 0, longest: 3 });
  });

  it("ngày trùng nhau chỉ tính một lần", () => {
    const days = ["2026-09-15", "2026-09-15", "2026-09-16"];
    expect(computeStreak(days, today).current).toBe(2);
  });
});
