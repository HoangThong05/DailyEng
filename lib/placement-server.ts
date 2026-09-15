import type { DeckLevel } from "@/lib/database.types";
import {
  LEVEL_QUOTA,
  LEVELS,
  OPTION_COUNT,
  type PlacementQuestion,
  shuffle,
} from "@/lib/placement";
import { createClient } from "@/lib/supabase/server";

/** Lấy từ từ ngần này bộ mỗi mức, để câu hỏi trải đều chủ đề. */
const DECKS_PER_LEVEL = 3;

/**
 * Dựng đề kiểm tra đầu vào: mỗi mức bốc vài bộ ngẫu nhiên, lấy từ, rồi chọn
 * đủ chỉ tiêu. Đáp án nhiễu là nghĩa của từ cùng mức để không đoán được
 * theo độ khó. Mỗi lần gọi là một đề khác.
 */
export async function buildPlacementQuestions(): Promise<PlacementQuestion[]> {
  const supabase = await createClient();
  const { data: decks } = await supabase
    .from("decks")
    .select("id, level")
    .is("owner_id", null);

  const questions: PlacementQuestion[] = [];

  for (const level of LEVELS) {
    const ids = shuffle((decks ?? []).filter((deck) => deck.level === level).map((deck) => deck.id)).slice(
      0,
      DECKS_PER_LEVEL,
    );
    if (ids.length === 0) continue;

    const { data: words } = await supabase
      .from("words")
      .select("id, term, phonetic, meaning_vi")
      .in("deck_id", ids);
    if (!words?.length) continue;

    const pool = shuffle(words);
    const chosen = pool.slice(0, LEVEL_QUOTA[level]);
    const meanings = [...new Set(pool.map((word) => word.meaning_vi))];

    for (const word of chosen) {
      const distractors = shuffle(
        meanings.filter((meaning) => meaning.toLowerCase() !== word.meaning_vi.toLowerCase()),
      ).slice(0, OPTION_COUNT - 1);
      if (distractors.length < OPTION_COUNT - 1) continue;
      const options = shuffle([word.meaning_vi, ...distractors]);
      questions.push({
        wordId: word.id,
        term: word.term,
        phonetic: word.phonetic,
        level: level as DeckLevel,
        options,
        correctIndex: options.indexOf(word.meaning_vi),
      });
    }
  }

  // Dễ trước khó sau để người mới không nản ngay câu đầu.
  const order: Record<DeckLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };
  return questions.sort((a, b) => order[a.level] - order[b.level]);
}
