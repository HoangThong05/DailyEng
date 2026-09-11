"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { findDuplicates, parseWords } from "@/lib/word-import";

export type AddWordsState = { error?: string; notice?: string };

/** Làm mới mọi trang có đếm số từ hoặc liệt kê từ của bộ. */
function revalidateDeck(deckId: string) {
  revalidatePath("/hoc");
  revalidatePath(`/hoc/${deckId}`);
  revalidatePath(`/hoc/${deckId}/sua`);
  revalidatePath("/quiz");
  revalidatePath("/phat-am");
}

/**
 * Thêm nhiều từ vào bộ có sẵn. Từ đã có trong bộ được bỏ qua chứ không báo
 * lỗi — dán nguyên một danh sách dài thì khó mà tự lọc trước được.
 */
export async function addWords(
  deckId: string,
  _prevState: AddWordsState,
  formData: FormData,
): Promise<AddWordsState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Phiên đăng nhập đã hết hạn." };

  const { words, badLines } = parseWords(String(formData.get("words") ?? ""));

  if (badLines.length > 0) {
    return {
      error: `Dòng ${badLines.join(", ")} chưa đúng dạng "word = nghĩa".`,
    };
  }
  if (words.length === 0) return { error: "Chưa có từ nào để thêm." };

  const supabase = await createClient();

  // RLS chỉ cho insert vào bộ của mình, nhưng đọc trước để báo lỗi tử tế
  // thay vì để Postgres từ chối.
  const { data: existing } = await supabase
    .from("words")
    .select("term, position")
    .eq("deck_id", deckId);

  if (!existing) return { error: "Không tìm thấy bộ từ." };

  const { repeated, existing: skipped } = findDuplicates(
    words,
    existing.map((word) => word.term),
  );
  if (repeated.length > 0) {
    return {
      error: `Bị lặp từ: ${repeated.join(", ")}. Mỗi từ chỉ để một lần.`,
    };
  }

  const skippedSet = new Set(skipped.map((term) => term.toLowerCase()));
  const fresh = words.filter((word) => !skippedSet.has(word.term.toLowerCase()));

  if (fresh.length === 0) {
    return { error: "Tất cả các từ này đã có trong bộ rồi." };
  }

  const nextPosition =
    existing.reduce((max, word) => Math.max(max, word.position), -1) + 1;

  const { error } = await supabase.from("words").insert(
    fresh.map((word, index) => ({
      deck_id: deckId,
      term: word.term,
      meaning_vi: word.meaning,
      position: nextPosition + index,
    })),
  );

  if (error) return { error: `Không lưu được từ: ${error.message}` };

  revalidateDeck(deckId);

  const notice = `Đã thêm ${fresh.length} từ.`;
  return {
    notice:
      skipped.length > 0
        ? `${notice} Bỏ qua ${skipped.length} từ đã có: ${skipped.join(", ")}.`
        : notice,
  };
}

export async function deleteWord(deckId: string, wordId: string) {
  const supabase = await createClient();
  // RLS đảm bảo chỉ xoá được từ trong bộ của mình; word_progress và review_log
  // của từ đó tự mất theo nhờ on delete cascade.
  await supabase.from("words").delete().eq("id", wordId).eq("deck_id", deckId);
  revalidateDeck(deckId);
}

export async function deleteDeck(deckId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("decks").delete().eq("id", deckId);
  if (error) return;

  revalidateDeck(deckId);
  redirect("/hoc");
}
