"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export type CreateDeckState = { error?: string };

type ParsedWord = { term: string; meaning: string };

/**
 * Tách khối văn bản thành danh sách từ.
 * Mỗi dòng một từ, dạng `word = nghĩa`.
 */
function parseWords(raw: string): { words: ParsedWord[]; badLines: number[] } {
  const words: ParsedWord[] = [];
  const badLines: number[] = [];

  raw.split("\n").forEach((line, position) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const separator = trimmed.indexOf("=");
    if (separator < 0) {
      badLines.push(position + 1);
      return;
    }

    const term = trimmed.slice(0, separator).trim();
    const meaning = trimmed.slice(separator + 1).trim();

    if (!term || !meaning) badLines.push(position + 1);
    else words.push({ term, meaning });
  });

  return { words, badLines };
}

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

  // Bảng words có ràng buộc unique (deck_id, term) nên phải chặn trùng từ trước,
  // không thì cả câu insert bị từ chối và người dùng nhận lỗi Postgres khó hiểu.
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const word of words) {
    const key = word.term.toLowerCase();
    if (seen.has(key)) duplicates.add(word.term);
    else seen.add(key);
  }

  if (duplicates.size > 0) {
    return {
      error: `Bị lặp từ: ${[...duplicates].join(", ")}. Mỗi từ chỉ để một lần.`,
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
  redirect(`/hoc/${deck.id}`);
}