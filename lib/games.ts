import { todayInAppZone } from "@/lib/leitner";
import { MATCH_MIN_WORDS, MATCH_PAIRS, shuffle, type MatchPair } from "@/lib/match-game";
import { createClient } from "@/lib/supabase/server";

export { MATCH_MIN_WORDS, MATCH_PAIRS, buildMatchTiles } from "@/lib/match-game";
export type { MatchPair, MatchTile } from "@/lib/match-game";

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
