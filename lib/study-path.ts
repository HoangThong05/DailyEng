/**
 * "Học theo chặng": phần thuần logic, không import gì phía server.
 *
 * Một phiên chia thành các chặng STAGE_SIZE từ. Trong mỗi chặng, từ đi qua
 * tối đa 3 bước tuỳ độ quen:
 *   - meet   : gặp từ (chỉ đọc, không kiểm tra)     — từ mới / vừa quên
 *   - choose : trắc nghiệm 4 lựa chọn               — hộp 1–3
 *   - type   : gõ lại từ / điền vào câu             — mọi từ; bước quyết định
 * Chỉ bước type mới cập nhật Leitner, mỗi từ đúng một lần trong phiên.
 */

export const STAGE_SIZE = 5;
export const OPTION_COUNT = 4;
/** Sai bao nhiêu lần ở bước gõ thì lộ đáp án và đi tiếp. */
export const MAX_TYPE_ATTEMPTS = 2;
/** Từ sai được cho làm lại tối đa ngần này lần trong phiên. */
export const MAX_RETRIES = 2;

export type PathWord = {
  id: string;
  term: string;
  phonetic: string | null;
  meaning_vi: string;
  example_en: string | null;
  example_vi: string | null;
  box: number;
};

/** Nguồn đáp án nhiễu: nghĩa và từ của cả bộ (và bộ khác nếu bộ quá nhỏ). */
export type Pool = { terms: string[]; meanings: string[] };

export type ChoosePrompt = "term" | "meaning" | "audio";

export type Step =
  | { kind: "meet"; word: PathWord }
  | {
      kind: "choose";
      word: PathWord;
      /** term: hiện từ → chọn nghĩa; meaning: hiện nghĩa → chọn từ; audio: nghe → chọn từ. */
      prompt: ChoosePrompt;
      options: string[];
      correctIndex: number;
    }
  | {
      kind: "type";
      word: PathWord;
      /** blank: câu ví dụ khuyết từ; recall: chỉ có nghĩa. */
      mode: "blank" | "recall";
      /** Câu ví dụ đã thay từ bằng ___ (chỉ khi blank). */
      sentence?: string;
    };

export type Stage = { index: number; words: PathWord[]; steps: Step[] };

/** Trộn mảng, không đụng vào mảng gốc. */
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Tìm từ trong câu ví dụ, chấp nhận biến thể đuôi (work → works/working).
 * Trả về [đầu, cuối) hoặc null nếu câu không chứa từ.
 */
export function findTermInSentence(sentence: string, term: string) {
  const core = term.trim();
  if (!core) return null;
  const pattern = new RegExp(`\\b${escapeRegex(core)}\\w{0,3}\\b`, "i");
  const match = pattern.exec(sentence);
  return match ? ([match.index, match.index + match[0].length] as const) : null;
}

/** Tách câu thành [trước, từ, sau] để tô sáng; không thấy từ thì trả cả câu ở "trước". */
export function splitSentence(sentence: string, term: string) {
  const range = findTermInSentence(sentence, term);
  if (!range) return { before: sentence, hit: "", after: "" };
  return {
    before: sentence.slice(0, range[0]),
    hit: sentence.slice(range[0], range[1]),
    after: sentence.slice(range[1]),
  };
}

export function buildChoose(
  word: PathWord,
  prompt: ChoosePrompt,
  pool: Pool,
): Step | null {
  const answer = prompt === "term" ? word.meaning_vi : word.term;
  const source = prompt === "term" ? pool.meanings : pool.terms;
  const distractors = shuffle(
    [...new Set(source)].filter(
      (item) => item.toLowerCase() !== answer.toLowerCase(),
    ),
  ).slice(0, OPTION_COUNT - 1);

  // Bộ quá ít từ, không dựng được câu hỏi có lựa chọn sai.
  if (distractors.length < 1) return null;

  const options = shuffle([answer, ...distractors]);
  return {
    kind: "choose",
    word,
    prompt,
    options,
    correctIndex: options.indexOf(answer),
  };
}

export function buildType(word: PathWord): Step {
  if (word.example_en) {
    const range = findTermInSentence(word.example_en, word.term);
    if (range) {
      const sentence =
        word.example_en.slice(0, range[0]) +
        "____" +
        word.example_en.slice(range[1]);
      return { kind: "type", word, mode: "blank", sentence };
    }
  }
  return { kind: "type", word, mode: "recall" };
}

/** Bước trắc nghiệm hợp với độ quen: từ mới thì xen kẽ dạng, từ quen thì nghe. */
function choosePromptFor(word: PathWord, index: number): ChoosePrompt {
  if (word.box >= 3) return "audio";
  return index % 2 === 0 ? "term" : "meaning";
}

/**
 * Dựng toàn bộ phiên. Gọi ở server để trộn ngẫu nhiên một lần; client chỉ
 * việc đi theo, không tự trộn lúc render.
 */
export function buildStages(words: PathWord[], pool: Pool): Stage[] {
  const stages: Stage[] = [];

  for (let start = 0; start < words.length; start += STAGE_SIZE) {
    const chunk = words.slice(start, start + STAGE_SIZE);
    const steps: Step[] = [];

    // 1. Gặp từ mới (hộp 1) — giữ thứ tự để từ dễ (position thấp) lên trước.
    for (const word of chunk) {
      if (word.box <= 1) steps.push({ kind: "meet", word });
    }

    // 2. Trắc nghiệm cho từ chưa quen lắm, trộn thứ tự.
    shuffle(chunk.filter((word) => word.box <= 3)).forEach((word, i) => {
      const step = buildChoose(word, choosePromptFor(word, i), pool);
      if (step) steps.push(step);
    });

    // 3. Gõ lại — tất cả các từ, trộn thứ tự.
    for (const word of shuffle(chunk)) steps.push(buildType(word));

    stages.push({ index: stages.length, words: chunk, steps });
  }

  return stages;
}

/** Gợi ý sau khi gõ sai: chữ cái đầu + số chữ còn lại ("a _ _ _ _"). */
export function hintFor(term: string) {
  return term
    .split(" ")
    .map((part) => part[0] + " _".repeat(Math.max(0, part.length - 1)))
    .join("   ");
}
