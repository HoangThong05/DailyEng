import { describe, expect, it } from "vitest";
import {
  AI_DAILY_LIMIT,
} from "@/lib/ai";
import {
  DAILY_ANSWER_XP_CAP,
  dailyAnswerXp,
  levelFromXp,
  titleForLevel,
  XP_FORGOT,
  XP_REMEMBERED,
  xpForAnswers,
  xpToReach,
} from "@/lib/xp";

describe("xpForAnswers", () => {
  it("cộng theo số lượt nhớ và quên", () => {
    expect(xpForAnswers(10, 4)).toBe(10 * XP_REMEMBERED + 4 * XP_FORGOT);
    expect(xpForAnswers(0, 0)).toBe(0);
  });
});

describe("dailyAnswerXp", () => {
  it("áp trần theo ngày", () => {
    expect(dailyAnswerXp(10, 0)).toBe(50);
    expect(dailyAnswerXp(1000, 1000)).toBe(DAILY_ANSWER_XP_CAP);
  });
});

describe("xpToReach", () => {
  it("cấp 1 cần 0 XP, sau đó tăng dần", () => {
    expect(xpToReach(1)).toBe(0);
    expect(xpToReach(2)).toBe(200);
    expect(xpToReach(3)).toBe(600);
    expect(xpToReach(10)).toBe(9000);
  });

  it("luôn tăng, không có cấp nào cần ít XP hơn cấp trước", () => {
    for (let level = 1; level < 30; level++) {
      expect(xpToReach(level + 1)).toBeGreaterThan(xpToReach(level));
    }
  });
});

describe("levelFromXp", () => {
  it("0 XP là cấp 1", () => {
    const info = levelFromXp(0);
    expect(info.level).toBe(1);
    expect(info.current).toBe(0);
    expect(info.percent).toBe(0);
  });

  it("đúng mốc thì lên cấp mới", () => {
    expect(levelFromXp(xpToReach(5)).level).toBe(5);
    expect(levelFromXp(xpToReach(5) - 1).level).toBe(4);
  });

  it("phần trăm luôn nằm trong 0–100 và khớp current/needed", () => {
    for (const xp of [0, 1, 199, 200, 5_000, 123_456]) {
      const info = levelFromXp(xp);
      expect(info.percent).toBeGreaterThanOrEqual(0);
      expect(info.percent).toBeLessThanOrEqual(100);
      expect(info.current).toBeLessThan(info.needed);
      expect(info.total).toBe(xp);
    }
  });
});

describe("titleForLevel", () => {
  it("danh hiệu đổi theo mốc cấp", () => {
    expect(titleForLevel(1)).toBe("Người mới");
    expect(titleForLevel(10)).toBe("Cao thủ");
    expect(titleForLevel(25)).toBe("Huyền thoại");
  });
});

describe("hạn mức AI", () => {
  it("có giá trị mặc định hợp lệ", () => {
    expect(AI_DAILY_LIMIT).toBeGreaterThan(0);
  });
});
