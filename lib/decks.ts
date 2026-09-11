import type { Word } from "@/lib/database.types";
import { todayInAppZone } from "@/lib/leitner";
import { createClient } from "@/lib/supabase/server";

/** Số thẻ tối đa trong một phiên học, để phiên không dài lê thê. */
export const SESSION_SIZE = 20;

export type DeckSummary = {
  id: string;
  name: string;
  description: string | null;
  level: string | null;
  isOwn: boolean;
  wordCount: number;
  dueCount: number;
};

export type StudyCard = Word & { box: number };

/**
 * Danh sách bộ thẻ kèm số từ đến hạn hôm nay.
 *
 * Số "đến hạn" được gộp ở phía JS chứ không phải trong SQL: PostgREST không
 * biểu diễn gọn được phép đếm "từ chưa từng học HOẶC đã tới hạn". Với vài trăm
 * từ thì hoàn toàn ổn — khi kho từ lớn lên thì chuyển sang view hoặc RPC.
 */
export async function listDecks(): Promise<DeckSummary[]> {
  const supabase = await createClient();
  const today = todayInAppZone();

  // RLS đã lọc sẵn: chỉ trả về bộ công khai và bộ của chính người dùng.
  const [decksResult, wordsResult, progressResult] = await Promise.all([
    supabase
      .from("decks")
      .select("id, name, description, level, owner_id, position")
      .order("owner_id", { nullsFirst: true })
      .order("position"),
    supabase.from("words").select("id, deck_id"),
    supabase.from("word_progress").select("word_id, due_on"),
  ]);

  const decks = decksResult.data ?? [];
  const words = wordsResult.data ?? [];
  const progress = progressResult.data ?? [];

  const dueByWordId = new Map(progress.map((row) => [row.word_id, row.due_on]));

  const counts = new Map<string, { total: number; due: number }>();
  for (const word of words) {
    const entry = counts.get(word.deck_id) ?? { total: 0, due: 0 };
    entry.total += 1;

    const dueOn = dueByWordId.get(word.id);
    // Chưa có tiến độ nghĩa là từ mới, luôn tính là đến hạn.
    if (dueOn === undefined || dueOn <= today) entry.due += 1;

    counts.set(word.deck_id, entry);
  }

  return decks.map((deck) => {
    const entry = counts.get(deck.id) ?? { total: 0, due: 0 };
    return {
      id: deck.id,
      name: deck.name,
      description: deck.description,
      level: deck.level,
      isOwn: deck.owner_id !== null,
      wordCount: entry.total,
      dueCount: entry.due,
    };
  });
}

/**
 * Bộ thẻ + toàn bộ từ trong đó.
 *
 * Không lọc theo hạn ôn: luyện phát âm là kỹ năng khác với nhớ nghĩa, muốn tập
 * từ nào lúc nào cũng được.
 */
export async function getDeckWithWords(deckId: string) {
  const supabase = await createClient();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, name")
    .eq("id", deckId)
    .maybeSingle();

  if (!deck) return null;

  const { data: words } = await supabase
    .from("words")
    .select("*")
    .eq("deck_id", deckId)
    .order("position");

  return { deck, words: words ?? [] };
}

/** Bộ thẻ + các từ đến hạn hôm nay, đã sắp xếp sẵn cho phiên học. */
export async function getStudySession(deckId: string) {
  const supabase = await createClient();
  const today = todayInAppZone();

  const { data: row } = await supabase
    .from("decks")
    .select("id, name, description, owner_id")
    .eq("id", deckId)
    .maybeSingle();

  if (!row) return null;

  // RLS chỉ cho thấy bộ công khai và bộ của mình, nên có owner_id tức là của mình.
  const deck = {
    id: row.id,
    name: row.name,
    description: row.description,
    isOwn: row.owner_id !== null,
  };

  const { data: words } = await supabase
    .from("words")
    .select("*")
    .eq("deck_id", deckId)
    .order("position");

  if (!words?.length) return { deck, cards: [] as StudyCard[], totalWords: 0 };

  const { data: progress } = await supabase
    .from("word_progress")
    .select("word_id, box, due_on")
    .in(
      "word_id",
      words.map((word) => word.id),
    );

  const progressByWordId = new Map(
    (progress ?? []).map((row) => [row.word_id, row]),
  );

  const due = words.filter((word) => {
    const row = progressByWordId.get(word.id);
    return row === undefined || row.due_on <= today;
  });

  // Từ ở hộp thấp (hay quên) được ưu tiên lên trước.
  const cards: StudyCard[] = due
    .map((word) => ({ ...word, box: progressByWordId.get(word.id)?.box ?? 1 }))
    .sort((a, b) => a.box - b.box || a.position - b.position)
    .slice(0, SESSION_SIZE);

  return { deck, cards, totalWords: words.length };
}
/**
 * Bộ thẻ của chính người dùng kèm toàn bộ từ, cho trang sửa bộ.
 * Bộ công khai (owner_id null) trả về null như không tồn tại: không ai sửa được.
 */
export async function getOwnDeckWithWords(deckId: string) {
  const supabase = await createClient();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, name, description")
    .eq("id", deckId)
    .not("owner_id", "is", null)
    .maybeSingle();

  if (!deck) return null;

  const { data: words } = await supabase
    .from("words")
    .select("id, term, meaning_vi, position")
    .eq("deck_id", deckId)
    .order("position");

  return { deck, words: words ?? [] };
}
