import { describe, expect, it } from "vitest";
import {
  buildChoose,
  buildStages,
  findTermInSentence,
  hintFor,
  OPTION_COUNT,
  type PathWord,
  splitSentence,
  STAGE_SIZE,
} from "@/lib/study-path";

function word(i: number, box = 1): PathWord {
  return {
    id: `w${i}`,
    term: `word${i}`,
    phonetic: null,
    meaning_vi: `nghĩa ${i}`,
    example_en: `This is word${i} in a sentence.`,
    example_vi: `Đây là từ ${i}.`,
    box,
  };
}

const pool = {
  terms: Array.from({ length: 10 }, (_, i) => `word${i}`),
  meanings: Array.from({ length: 10 }, (_, i) => `nghĩa ${i}`),
};

describe("findTermInSentence", () => {
  it("tìm được từ, chấp nhận đuôi biến thể", () => {
    expect(findTermInSentence("She works here.", "work")).not.toBeNull();
    expect(findTermInSentence("He is working now.", "work")).not.toBeNull();
  });

  it("không tìm thấy thì trả null", () => {
    expect(findTermInSentence("Nothing here.", "invoice")).toBeNull();
  });
});

describe("splitSentence", () => {
  it("tách đúng ba phần quanh từ", () => {
    const parts = splitSentence("Please sign the form.", "sign");
    expect(parts.before).toBe("Please ");
    expect(parts.hit).toBe("sign");
    expect(parts.after).toBe(" the form.");
  });

  it("không thấy từ thì giữ nguyên cả câu", () => {
    const parts = splitSentence("Nothing here.", "invoice");
    expect(parts.before).toBe("Nothing here.");
    expect(parts.hit).toBe("");
  });
});

describe("buildChoose", () => {
  it("có đủ lựa chọn và đáp án đúng nằm trong đó", () => {
    const step = buildChoose(word(1), "term", pool);
    expect(step).not.toBeNull();
    if (step?.kind !== "choose") throw new Error("phải là bước trắc nghiệm");
    expect(step.options).toHaveLength(OPTION_COUNT);
    expect(step.options[step.correctIndex]).toBe("nghĩa 1");
    expect(new Set(step.options).size).toBe(OPTION_COUNT);
  });

  it("không dựng được khi không có đáp án nhiễu", () => {
    const tiny = { terms: ["word1"], meanings: ["nghĩa 1"] };
    expect(buildChoose(word(1), "term", tiny)).toBeNull();
  });
});

describe("buildStages", () => {
  it("chia đúng số chặng theo STAGE_SIZE", () => {
    const words = Array.from({ length: STAGE_SIZE * 2 + 1 }, (_, i) => word(i));
    const stages = buildStages(words, pool);
    expect(stages).toHaveLength(3);
    expect(stages[0].words).toHaveLength(STAGE_SIZE);
    expect(stages[2].words).toHaveLength(1);
  });

  it("mọi từ đều có bước gõ lại", () => {
    const words = Array.from({ length: 3 }, (_, i) => word(i));
    const steps = buildStages(words, pool)[0].steps;
    const typed = steps.filter((step) => step.kind === "type").map((step) => step.word.id);
    expect(new Set(typed)).toEqual(new Set(["w0", "w1", "w2"]));
  });

  it("từ ở hộp cao không phải gặp lại từ đầu", () => {
    const steps = buildStages([word(0, 5)], pool)[0].steps;
    expect(steps.some((step) => step.kind === "meet")).toBe(false);
  });

  it("danh sách rỗng thì không có chặng nào", () => {
    expect(buildStages([], pool)).toHaveLength(0);
  });
});

describe("hintFor", () => {
  it("giữ chữ cái đầu mỗi tiếng", () => {
    expect(hintFor("take")).toBe("t _ _ _");
    expect(hintFor("take off")).toBe("t _ _ _   o _ _");
  });
});
