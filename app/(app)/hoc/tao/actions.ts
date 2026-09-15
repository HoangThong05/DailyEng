"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { findDuplicates, parseWords } from "@/lib/word-import";

export type CreateDeckState = { error?: string };

export async function createDeck(
  _prevState: CreateDeckState,
  formData: FormData,
): Promise<CreateDeckState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Phiên đăng nhập đã hết hạn." };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const raw = String(formData.get("words") ?? "");

  if (!name) return { error: "Đặt tên cho bộ từ đã nhé." };

  const { words, badLines } = parseWords(raw);

  if (badLines.length > 0) {
    return {
      error: `Dòng ${badLines.join(", ")} chưa đúng dạng "word = nghĩa".`,
    };
  }
  if (words.length === 0) {
    return { error: "Thêm ít nhất một từ vào bộ." };
  }

  const { repeated } = findDuplicates(words);
  if (repeated.length > 0) {
    return {
      error: `Bị lặp từ: ${repeated.join(", ")}. Mỗi từ chỉ để một lần.`,
    };
  }

  const supabase = await createClient();

  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .insert({
      owner_id: user.id,
      name,
      description: description || null,
    })
    .select("id")
    .single();

  if (deckError || !deck) {
    return { error: deckError?.message ?? "Không tạo được bộ từ." };
  }

  const { error: wordsError } = await supabase.from("words").insert(
    words.map((word, position) => ({
      deck_id: deck.id,
      term: word.term,
      meaning_vi: word.meaning,
      position,
    })),
  );

  if (wordsError) {
    // Bộ rỗng thì vô dụng, dọn luôn để không để lại rác.
    await supabase.from("decks").delete().eq("id", deck.id);
    return { error: `Không lưu được từ: ${wordsError.message}` };
  }

  revalidatePath("/hoc");
  revalidatePath("/tai-khoan");
  revalidatePath("/bo-cua-toi");
  redirect(`/hoc/${deck.id}`);
}
