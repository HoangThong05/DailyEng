"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { findDuplicates, parseWords } from "@/lib/word-import";

export type AddWordsState = { error?: string; notice?: string };
export type EditWordState = { error?: string; notice?: string };

/** Khớp giới hạn hợp lý cho một ô nhập trên điện thoại; DB không giới hạn. */
const MAX_TERM = 80;
const MAX_TEXT = 200;

/** Làm mới mọi trang có đếm số từ hoặc liệt kê từ của bộ. */
function revalidateDeck(deckId: string) {
  revalidatePath("/hoc");
  revalidatePath("/tai-khoan");
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
  // Bộ của mình nằm ở tab Cá nhân.
  redirect("/tai-khoan");
}

/** Đọc một ô text, cắt khoảng trắng; rỗng thì trả null để lưu NULL thay vì "". */
function optionalText(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value ? value : null;
}

export async function updateWord(
  deckId: string,
  wordId: string,
  _prevState: EditWordState,
  formData: FormData,
): Promise<EditWordState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Phiên đăng nhập đã hết hạn." };

  const term = String(formData.get("term") ?? "").trim();
  const meaning = String(formData.get("meaning_vi") ?? "").trim();
  const phonetic = optionalText(formData, "phonetic");
  const exampleEn = optionalText(formData, "example_en");
  const exampleVi = optionalText(formData, "example_vi");

  if (!term) return { error: "Từ không được để trống." };
  if (!meaning) return { error: "Nghĩa không được để trống." };
  if (term.length > MAX_TERM) return { error: `Từ tối đa ${MAX_TERM} ký tự.` };
  for (const value of [meaning, phonetic, exampleEn, exampleVi]) {
    if (value && value.length > MAX_TEXT) {
      return { error: `Mỗi ô tối đa ${MAX_TEXT} ký tự.` };
    }
  }

  const supabase = await createClient();

  // Đổi sang từ đã có trong bộ thì unique (deck_id, term) sẽ chặn — báo trước.
  const { data: clash } = await supabase
    .from("words")
    .select("id")
    .eq("deck_id", deckId)
    .ilike("term", term)
    .neq("id", wordId)
    .maybeSingle();

  if (clash) return { error: `Bộ này đã có từ "${term}" rồi.` };

  const { error } = await supabase
    .from("words")
    .update({
      term,
      meaning_vi: meaning,
      phonetic,
      example_en: exampleEn,
      example_vi: exampleVi,
    })
    .eq("id", wordId)
    .eq("deck_id", deckId);

  if (error) return { error: `Không lưu được: ${error.message}` };

  revalidateDeck(deckId);
  revalidatePath(`/hoc/${deckId}/sua/${wordId}`);
  return { notice: "Đã lưu." };
}
