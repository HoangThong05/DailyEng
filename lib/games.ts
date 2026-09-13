import {
  DICTATION_SIZE,
  RAIN_SIZE,
  SENTENCE_SIZE,
  type GameWord,
  type SentenceItem,
} from "@/lib/dictation-game";
import { todayInAppZone } from "@/lib/leitner";
import { MATCH_MIN_WORDS, MATCH_PAIRS, shuffle, type MatchPair } from "@/lib/match-game";
import { createClient } from "@/lib/supabase/server";

export { MATCH_MIN_WORDS, MATCH_PAIRS, buildMatchTiles } from "@/lib/match-game";
export type { MatchPair, MatchTile } from "@/lib/match-game";
export type { DictationWord, GameWord, SentenceItem } from "@/lib/dictation-game";

/**
 * Dựng một ván ghép cặp từ bộ thẻ.
 *
 * Ưu tiên từ đến hạn ôn (hoặc chưa học) để ván chơi cũng là một lượt ôn thật;
 * thiếu thì bù bằng từ ngẫu nhiên trong bộ. Nghĩa trùng nhau bị loại vì hai ô
 * nghĩa giống hệt sẽ không biết ghép với từ nào.
 */
export async function getMatchSession(deckId: string) {
  const supabase = await createClient();
  const today = todayInAppZone();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, name")
    .eq("id", deckId)
    .maybeSingle();

  if (!deck) return null;

  const { data: words } = await supabase
    .from("words")
    .select("id, term, meaning_vi")
    .eq("deck_id", deckId);

  const wordCount = words?.length ?? 0;
  if (!words || wordCount < MATCH_MIN_WORDS) {
    return { deck, pairs: [] as MatchPair[], wordCount };
  }

  const { data: progress } = await supabase
    .from("word_progress")
    .select("word_id, due_on")
    .in(
      "word_id",
      words.map((word) => word.id),
    );

  const dueByWordId = new Map(
    (progress ?? []).map((row) => [row.word_id, row.due_on]),
  );

  const due = words.filter((word) => {
    const dueOn = dueByWordId.get(word.id);
    return dueOn === undefined || dueOn <= today;
  });
  const rest = words.filter((word) => !due.includes(word));

  const chosen: MatchPair[] = [];
  const seenMeanings = new Set<string>();
  for (const word of [...shuffle(due), ...shuffle(rest)]) {
    if (chosen.length >= MATCH_PAIRS) break;
    const key = word.meaning_vi.trim().toLowerCase();
    if (seenMeanings.has(key)) continue;
    seenMeanings.add(key);
    chosen.push({ wordId: word.id, term: word.term, meaning: word.meaning_vi });
  }

  return { deck, pairs: chosen, wordCount };
}

/**
 * Chọn từ cho các trò gõ chữ: ưu tiên từ đến hạn ôn, bù bằng từ ngẫu nhiên.
 */
async function pickGameWords(deckId: string, size: number) {
  const supabase = await createClient();
  const today = todayInAppZone();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, name")
    .eq("id", deckId)
    .maybeSingle();

  if (!deck) return null;

  const { data: words } = await supabase
    .from("words")
    .select("id, term, meaning_vi, phonetic")
    .eq("deck_id", deckId);

  const wordCount = words?.length ?? 0;
  if (!words || wordCount === 0) {
    return { deck, words: [] as GameWord[], wordCount };
  }

  const { data: progress } = await supabase
    .from("word_progress")
    .select("word_id, due_on")
    .in(
      "word_id",
      words.map((word) => word.id),
    );

  const dueByWordId = new Map(
    (progress ?? []).map((row) => [row.word_id, row.due_on]),
  );
  const due = words.filter((word) => {
    const dueOn = dueByWordId.get(word.id);
    return dueOn === undefined || dueOn <= today;
  });
  const rest = words.filter((word) => !due.includes(word));

  const chosen: GameWord[] = [...shuffle(due), ...shuffle(rest)]
    .slice(0, size)
    .map((word) => ({
      wordId: word.id,
      term: word.term,
      meaning: word.meaning_vi,
      phonetic: word.phonetic,
      // 4–70%: giọt rộng tới ~30% màn nên không bị cắt ở mép phải.
      left: 4 + Math.round(Math.random() * 66),
    }));

  return { deck, words: chosen, wordCount };
}

export function getDictationSession(deckId: string) {
  return pickGameWords(deckId, DICTATION_SIZE);
}

export function getRainSession(deckId: string) {
  return pickGameWords(deckId, RAIN_SIZE);
}

/**
 * Nghe chép câu: lấy từ có câu ví dụ, ưu tiên từ đến hạn, mỗi câu một từ.
 */
export async function getSentenceSession(deckId: string) {
  const supabase = await createClient();
  const today = todayInAppZone();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, name")
    .eq("id", deckId)
    .maybeSingle();
  if (!deck) return null;

  const { data: words } = await supabase
    .from("words")
    .select("id, term, meaning_vi, example_en, example_vi")
    .eq("deck_id", deckId)
    .not("example_en", "is", null);

  const withSentence = (words ?? []).filter(
    (word): word is typeof word & { example_en: string } =>
      !!word.example_en && word.example_en.trim().split(/\s+/).length >= 3,
  );
  if (withSentence.length === 0) {
    return { deck, items: [] as SentenceItem[], sentenceCount: 0 };
  }

  const { data: progress } = await supabase
    .from("word_progress")
    .select("word_id, due_on")
    .in(
      "word_id",
      withSentence.map((word) => word.id),
    );
  const dueByWordId = new Map(
    (progress ?? []).map((row) => [row.word_id, row.due_on]),
  );
  const due = withSentence.filter((word) => {
    const dueOn = dueByWordId.get(word.id);
    return dueOn === undefined || dueOn <= today;
  });
  const rest = withSentence.filter((word) => !due.includes(word));

  const items: SentenceItem[] = [...shuffle(due), ...shuffle(rest)]
    .slice(0, SENTENCE_SIZE)
    .map((word) => ({
      wordId: word.id,
      term: word.term,
      meaning: word.meaning_vi,
      sentence: word.example_en.trim(),
      translation: word.example_vi,
    }));

  return { deck, items, sentenceCount: withSentence.length };
}
