import { MAX_BOX, todayInAppZone } from "@/lib/leitner";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

/**
 * "Từ của tôi": một bộ riêng tự tạo cho mỗi người, để lưu nhanh từ gặp ở
 * ngoài (đọc báo, xem phim, hỏi AI...) rồi học/ôn như bộ thường.
 *
 * Nhận diện bằng tên cố định trong bộ của người dùng — không thêm cột mới.
 * Xoá bộ thì lần lưu từ kế tiếp tự tạo lại.
 */
export const MY_DECK_NAME = "Từ của tôi";

/**
 * "Từ của tôi" cài đặt như một bộ của người dùng, nhưng có trang riêng
 * (/tu-cua-toi) nên không liệt kê chung với bộ tự tạo — tránh thấy cùng một
 * thứ ở hai nơi.
 */
export function isMyWordsDeck(deck: { name: string; isOwn: boolean }) {
  return deck.isOwn && deck.name === MY_DECK_NAME;
}

export type MyWordStatus = "moi" | "dang-hoc" | "da-thuoc";

export type MyWord = {
  id: string;
  term: string;
  phonetic: string | null;
  meaningVi: string;
  exampleEn: string | null;
  status: MyWordStatus;
  /** Tới hạn ôn hôm nay (chỉ khi đang học). */
  due: boolean;
  createdAt: string;
};

export async function getMyDeck() {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("decks")
    .select("id, name")
    .eq("owner_id", user.id)
    .eq("name", MY_DECK_NAME)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  return data;
}

/** Bộ "Từ của tôi", tạo mới nếu chưa có. */
export async function ensureMyDeck() {
  const existing = await getMyDeck();
  if (existing) return existing;

  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("decks")
    .insert({
      owner_id: user.id,
      name: MY_DECK_NAME,
      description: "Từ mình gặp và muốn nhớ.",
    })
    .select("id, name")
    .single();
  return data;
}

/** Toàn bộ từ trong "Từ của tôi", mới lưu xếp trước, kèm trạng thái học. */
export async function listMyWords(): Promise<{ deckId: string | null; words: MyWord[] }> {
  const deck = await getMyDeck();
  if (!deck) return { deckId: null, words: [] };

  const supabase = await createClient();
  const [{ data: words }, { data: progress }] = await Promise.all([
    supabase
      .from("words")
      .select("id, term, phonetic, meaning_vi, example_en, created_at")
      .eq("deck_id", deck.id)
      .order("created_at", { ascending: false }),
    supabase.from("word_progress").select("word_id, box, due_on"),
  ]);

  const today = todayInAppZone();
  const byWord = new Map((progress ?? []).map((row) => [row.word_id, row]));

  return {
    deckId: deck.id,
    words: (words ?? []).map((word) => {
      const row = byWord.get(word.id);
      const status: MyWordStatus = !row ? "moi" : row.box >= MAX_BOX ? "da-thuoc" : "dang-hoc";
      return {
        id: word.id,
        term: word.term,
        phonetic: word.phonetic,
        meaningVi: word.meaning_vi,
        exampleEn: word.example_en,
        status,
        due: status === "dang-hoc" && row !== undefined && row.due_on <= today,
        createdAt: word.created_at,
      };
    }),
  };
}
