import type { DeckCategory, Word } from "@/lib/database.types";
import { todayInAppZone } from "@/lib/leitner";
import { createClient } from "@/lib/supabase/server";

/** Số thẻ tối đa trong một phiên học, để phiên không dài lê thê. */
export const SESSION_SIZE = 20;

export type DeckSummary = {
  id: string;
  /** Chỉ bộ công khai có slug; dùng để tìm ảnh bìa vẽ riêng. */
  slug: string | null;
  name: string;
  description: string | null;
  level: string | null;
  category: DeckCategory;
  isOwn: boolean;
  wordCount: number;
  /** Số từ đã học ít nhất một lần. */
  learnedCount: number;
  dueCount: number;
};

export type StudyCard = Word & { box: number };

/**
 * Danh sách bộ thẻ kèm số từ / đã học / đến hạn hôm nay.
 * Đếm bằng hàm SQL deck_summaries (schema-07) — RLS vẫn áp dụng vì hàm chạy
 * dưới quyền người gọi, nên chỉ thấy bộ công khai và bộ của chính mình.
 */
export async function listDecks(): Promise<DeckSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("deck_summaries", {
    today: todayInAppZone(),
  });

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    level: row.level,
    category: row.category,
    isOwn: row.is_own,
    wordCount: row.word_count,
    learnedCount: row.learned_count,
    dueCount: row.due_count,
  }));
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

  const empty = { terms: [] as string[], meanings: [] as string[] };
  if (!words?.length) {
    return { deck, cards: [] as StudyCard[], totalWords: 0, pool: empty };
  }

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

  // Đáp án nhiễu lấy trong cùng bộ cho khó; bộ nhỏ quá thì mượn bộ khác.
  const pool = {
    terms: words.map((word) => word.term),
    meanings: words.map((word) => word.meaning_vi),
  };
  if (words.length < 8) {
    const { data: extra } = await supabase
      .from("words")
      .select("term, meaning_vi")
      .neq("deck_id", deckId)
      .limit(40);
    for (const row of extra ?? []) {
      pool.terms.push(row.term);
      pool.meanings.push(row.meaning_vi);
    }
  }

  return { deck, cards, totalWords: words.length, pool };
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

/** Một từ trong bộ của chính người dùng, cho trang sửa từ. */
export async function getOwnWord(deckId: string, wordId: string) {
  const supabase = await createClient();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, name")
    .eq("id", deckId)
    .not("owner_id", "is", null)
    .maybeSingle();

  if (!deck) return null;

  const { data: word } = await supabase
    .from("words")
    .select("*")
    .eq("id", wordId)
    .eq("deck_id", deckId)
    .maybeSingle();

  if (!word) return null;
  return { deck, word };
}

/**
 * Ôn tập hôm nay: từ đã học ít nhất một lần và tới hạn, gom từ mọi bộ.
 * Khác getStudySession: không lấy từ mới (chưa có tiến độ) — đó là việc của
 * từng bộ; đây chỉ là lịch giãn cách Leitner.
 */
export async function getReviewSession() {
  const supabase = await createClient();
  const today = todayInAppZone();

  const [{ count }, { data: rows }] = await Promise.all([
    supabase
      .from("word_progress")
      .select("word_id", { count: "exact", head: true })
      .lte("due_on", today),
    supabase
      .from("word_progress")
      .select("word_id, box")
      .lte("due_on", today)
      // Hộp thấp (hay quên) và hạn cũ nhất lên trước.
      .order("box")
      .order("due_on")
      .limit(SESSION_SIZE),
  ]);

  const boxByWordId = new Map((rows ?? []).map((row) => [row.word_id, row.box]));
  const { data: words } = boxByWordId.size
    ? await supabase.from("words").select("*").in("id", [...boxByWordId.keys()])
    : { data: [] as Word[] };

  const cards: StudyCard[] = (words ?? [])
    .map((word) => ({ ...word, box: boxByWordId.get(word.id) ?? 1 }))
    .sort((a, b) => a.box - b.box);

  // Đáp án nhiễu: từ trong phiên cộng thêm vài từ cùng bộ cho đủ đa dạng.
  const pool = {
    terms: cards.map((word) => word.term),
    meanings: cards.map((word) => word.meaning_vi),
  };
  const deckIds = [...new Set(cards.map((word) => word.deck_id))];
  if (deckIds.length > 0) {
    const { data: extra } = await supabase
      .from("words")
      .select("term, meaning_vi")
      .in("deck_id", deckIds)
      .limit(60);
    for (const row of extra ?? []) {
      pool.terms.push(row.term);
      pool.meanings.push(row.meaning_vi);
    }
  }

  return { cards, totalDue: count ?? 0, pool };
}

/** Chỉ đếm từ đến hạn ôn (đã có tiến độ), cho trang chủ. */
export async function countDueReviews() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("word_progress")
    .select("word_id", { count: "exact", head: true })
    .lte("due_on", todayInAppZone());
  return count ?? 0;
}
