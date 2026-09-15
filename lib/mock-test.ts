import { createHmac, timingSafeEqual } from "node:crypto";
import bank from "@/content/toeic-part5.json";
import part2Bank from "@/content/toeic-part2.json";
import { shuffle } from "@/lib/match-game";
import { findTermInSentence } from "@/lib/study-path";
import { createClient } from "@/lib/supabase/server";

export type MockKind = "toeic-part5" | "toeic-part2";
export const MOCK_KINDS: MockKind[] = ["toeic-part5", "toeic-part2"];

/** Số câu mỗi đề và thời gian làm (giây) — Part 5 thật ~30 giây/câu. */
export const MOCK_SIZE = 20;
export const MOCK_SECONDS = 10 * 60;

/** Part 2: nghe câu hỏi và 3 đáp án, không in gì trên đề. ~25 giây/câu kể cả nghe. */
export const PART2_SIZE = 15;
export const PART2_SECONDS = 8 * 60;

export const MOCK_LIMIT_SECONDS: Record<MockKind, number> = {
  "toeic-part5": MOCK_SECONDS,
  "toeic-part2": PART2_SECONDS,
};
/** Bao nhiêu câu lấy từ ngân hàng viết tay, còn lại sinh từ bộ TOEIC. */
const BANK_SHARE = 10;

export type MockQuestion = {
  id: string;
  sentence: string;
  options: string[];
  answer: number;
  explain: string;
  tag: "grammar" | "vocab";
  /** Câu sinh từ bộ từ: có wordId để ghi Leitner khi nộp bài. */
  wordId?: string;
};

type BankItem = (typeof bank)[number];

function fromBank(item: BankItem): MockQuestion {
  // Ngân hàng để đáp án đúng ở vị trí cố định; trộn lại để không đoán được.
  const correct = item.options[item.answer];
  const options = shuffle(item.options);
  return {
    id: item.id,
    sentence: item.sentence,
    options,
    answer: options.indexOf(correct),
    explain: item.explain,
    tag: item.tag === "grammar" ? "grammar" : "vocab",
  };
}

/**
 * Dựng đề: nửa ngân hàng (ngữ pháp + từ vựng), nửa sinh từ câu ví dụ của các
 * bộ TOEIC — khuyết từ khoá, 3 đáp án nhiễu là từ khác cùng bộ.
 */
export async function buildMockTest(): Promise<MockQuestion[]> {
  const supabase = await createClient();

  const { data: words } = await supabase
    .from("words")
    .select("id, term, example_en, meaning_vi, decks!inner(category)")
    .eq("decks.category", "toeic")
    .not("example_en", "is", null)
    .limit(1500);

  const usable = (words ?? []).filter(
    (word) =>
      word.example_en &&
      !word.term.includes(" ") &&
      findTermInSentence(word.example_en, word.term),
  );
  const terms = [...new Set(usable.map((word) => word.term))];

  const generated: MockQuestion[] = shuffle(usable)
    .slice(0, MOCK_SIZE - BANK_SHARE)
    .map((word): MockQuestion => {
      const range = findTermInSentence(word.example_en!, word.term)!;
      const sentence =
        word.example_en!.slice(0, range[0]) +
        "____" +
        word.example_en!.slice(range[1]);
      const distractors = shuffle(
        terms.filter((term) => term.toLowerCase() !== word.term.toLowerCase()),
      ).slice(0, 3);
      const options = shuffle([word.term, ...distractors]);
      return {
        id: `w-${word.id}`,
        sentence,
        options,
        answer: options.indexOf(word.term),
        explain: `${word.term} = ${word.meaning_vi}`,
        tag: "vocab",
        wordId: word.id,
      };
    })
    .filter((question) => question.options.length === 4);

  const grammar = shuffle(bank.filter((item) => item.tag === "grammar"));
  const vocab = shuffle(bank.filter((item) => item.tag === "vocab"));
  const bankCount = MOCK_SIZE - generated.length;
  const half = Math.ceil(bankCount / 2);
  const picked = [...grammar.slice(0, half), ...vocab.slice(0, bankCount - half)];

  return shuffle([...picked.map(fromBank), ...generated]).slice(0, MOCK_SIZE);
}

export type Part2Question = {
  id: string;
  type: "wh" | "yesno" | "choice" | "statement" | "tag";
  question: string;
  options: string[];
  answer: number;
  explain: string;
};

/** Đề Part 2: bốc từ ngân hàng, trải đều các dạng câu hỏi, trộn thứ tự đáp án. */
export function buildPart2Test(): Part2Question[] {
  const byType = new Map<string, Part2Question[]>();
  for (const item of part2Bank) {
    const list = byType.get(item.type) ?? [];
    list.push(item as Part2Question);
    byType.set(item.type, list);
  }
  // Xoay vòng qua các dạng để đề không dồn một kiểu.
  const queues = [...byType.values()].map((list) => shuffle(list));
  const picked: Part2Question[] = [];
  while (picked.length < PART2_SIZE && queues.some((q) => q.length > 0)) {
    for (const queue of queues) {
      const item = queue.shift();
      if (item) picked.push(item);
      if (picked.length >= PART2_SIZE) break;
    }
  }
  return shuffle(picked).map((item) => {
    const correct = item.options[item.answer];
    const options = shuffle(item.options);
    return { ...item, options, answer: options.indexOf(correct) };
  });
}

/**
 * Đề được "ký" khi dựng: token = base64(đáp án) + chữ ký HMAC. Client nộp
 * token cùng lựa chọn, server ký lại để kiểm rồi tự chấm — client không tự
 * báo điểm được. Khoá lấy từ CRON_SECRET (đã có sẵn trên Vercel).
 */
export type MockKey = { ids: string[]; answers: number[]; wordIds: (string | null)[] };

function secret() {
  return process.env.CRON_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dailyeng";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function signMockKey(
  questions: { id: string; answer: number; wordId?: string }[],
): string {
  const key: MockKey = {
    ids: questions.map((q) => q.id),
    answers: questions.map((q) => q.answer),
    wordIds: questions.map((q) => q.wordId ?? null),
  };
  const payload = Buffer.from(JSON.stringify(key)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Giải token; sai chữ ký thì null. */
export function verifyMockKey(token: string): MockKey | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (
    expected.length !== signature.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as MockKey;
  } catch {
    return null;
  }
}

export type MockResultRow = {
  score: number;
  total: number;
  seconds: number;
  createdAt: string;
};

export async function getMockHistory(kind: MockKind = "toeic-part5", limit = 5) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mock_results")
    .select("score, total, seconds, created_at")
    .eq("kind", kind)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows: MockResultRow[] = (data ?? []).map((row) => ({
    score: row.score,
    total: row.total,
    seconds: row.seconds,
    createdAt: row.created_at,
  }));
  const best = rows.reduce<MockResultRow | null>(
    (top, row) => (!top || row.score > top.score ? row : top),
    null,
  );
  return { recent: rows.slice(0, limit), best, attempts: rows.length };
}
