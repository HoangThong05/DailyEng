import { createClient } from "@/lib/supabase/server";

/** Số câu tối đa trong một lượt quiz. */
export const QUIZ_SIZE = 10;
/** Số lựa chọn mỗi câu, gồm 1 đáp án đúng và 3 đáp án nhiễu. */
export const OPTION_COUNT = 4;

export type QuizQuestion = {
  wordId: string;
  term: string;
  phonetic: string | null;
  options: string[];
  correctIndex: number;
};

/** Trộn mảng, không đụng vào mảng gốc. */
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Dựng một lượt quiz từ bộ thẻ: hiện từ tiếng Anh, chọn nghĩa tiếng Việt đúng.
 *
 * Đáp án nhiễu ưu tiên lấy trong cùng bộ cho khó nhằn hơn; bộ ít từ quá thì
 * mượn thêm nghĩa từ các bộ khác.
 */
export async function getQuizSession(deckId: string) {
  const supabase = await createClient();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, name")
    .eq("id", deckId)
    .maybeSingle();

  if (!deck) return null;

  const { data: words } = await supabase
    .from("words")
    .select("id, term, phonetic, meaning_vi")
    .eq("deck_id", deckId);

  const wordCount = words?.length ?? 0;

  // Dưới 2 từ thì không dựng nổi câu hỏi có lựa chọn sai.
  if (!words || wordCount < 2) {
    return { deck, questions: [] as QuizQuestion[], wordCount };
  }

  const meanings = new Set(words.map((word) => word.meaning_vi));

  if (meanings.size < OPTION_COUNT) {
    const { data: extra } = await supabase
      .from("words")
      .select("meaning_vi")
      .neq("deck_id", deckId)
      .limit(60);

    for (const row of extra ?? []) meanings.add(row.meaning_vi);
  }

  const questions = shuffle(words)
    .slice(0, QUIZ_SIZE)
    .map((word) => {
      const distractors = shuffle(
        [...meanings].filter((meaning) => meaning !== word.meaning_vi),
      ).slice(0, OPTION_COUNT - 1);

      const options = shuffle([word.meaning_vi, ...distractors]);

      return {
        wordId: word.id,
        term: word.term,
        phonetic: word.phonetic,
        options,
        correctIndex: options.indexOf(word.meaning_vi),
      };
    })
    // Cả bộ chỉ toàn từ trùng nghĩa thì câu hỏi vô nghĩa, bỏ đi.
    .filter((question) => question.options.length >= 2);

  return { deck, questions, wordCount };
}