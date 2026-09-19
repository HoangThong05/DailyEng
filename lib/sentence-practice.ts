import { shuffle } from "@/lib/placement";
import { createClient } from "@/lib/supabase/server";

export type PracticeWord = {
  id: string;
  term: string;
  phonetic: string | null;
  meaningVi: string;
  exampleEn: string | null;
};

/** Số từ một lượt luyện đặt câu. */
export const PRACTICE_SIZE = 5;

/**
 * Từ để đặt câu: ưu tiên từ vừa học/ôn gần đây (đang nằm trong đầu, viết ra
 * là khắc sâu). Chưa học từ nào thì lấy từ bộ công khai mức cơ bản.
 */
export async function getPracticeWords(size = PRACTICE_SIZE): Promise<PracticeWord[]> {
  const supabase = await createClient();

  const { data: recent } = await supabase
    .from("word_progress")
    .select("word_id")
    .not("last_reviewed_at", "is", null)
    .order("last_reviewed_at", { ascending: false })
    .limit(40);

  let ids = shuffle((recent ?? []).map((row) => row.word_id)).slice(0, size);

  if (ids.length < size) {
    const { data: decks } = await supabase
      .from("decks")
      .select("id")
      .is("owner_id", null)
      .eq("level", "beginner")
      .limit(5);
    const deckIds = (decks ?? []).map((deck) => deck.id);
    if (deckIds.length > 0) {
      const { data: pool } = await supabase
        .from("words")
        .select("id")
        .in("deck_id", deckIds)
        .limit(120);
      const extra = shuffle((pool ?? []).map((row) => row.id)).filter((id) => !ids.includes(id));
      ids = [...ids, ...extra].slice(0, size);
    }
  }
  if (ids.length === 0) return [];

  const { data: words } = await supabase
    .from("words")
    .select("id, term, phonetic, meaning_vi, example_en")
    .in("id", ids);
  const order = new Map(ids.map((id, i) => [id, i]));

  return (words ?? [])
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((word) => ({
      id: word.id,
      term: word.term,
      phonetic: word.phonetic,
      meaningVi: word.meaning_vi,
      exampleEn: word.example_en,
    }));
}
