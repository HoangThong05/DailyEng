import bank from "@/content/toeic-part5.json";
import { shuffle } from "@/lib/match-game";
import { findTermInSentence } from "@/lib/study-path";
import { createClient } from "@/lib/supabase/server";

/** Số câu mỗi đề và thời gian làm (giây) — Part 5 thật ~30 giây/câu. */
export const MOCK_SIZE = 20;
export const MOCK_SECONDS = 10 * 60;
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

export type MockResultRow = {
  score: number;
  total: number;
  seconds: number;
  createdAt: string;
};

export async function getMockHistory(limit = 5) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mock_results")
    .select("score, total, seconds, created_at")
    .eq("kind", "toeic-part5")
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
