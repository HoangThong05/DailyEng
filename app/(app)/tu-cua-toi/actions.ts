"use server";

import { revalidatePath } from "next/cache";
import { ensureMyDeck } from "@/lib/my-words";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export type SaveWordState = { error?: string; notice?: string };

const MAX_TERM = 80;
const MAX_TEXT = 200;

function optionalText(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value ? value : null;
}

function revalidateAll(deckId: string) {
  revalidatePath("/tu-cua-toi");
  revalidatePath("/hoc");
  revalidatePath(`/hoc/${deckId}`);
  revalidatePath("/tai-khoan");
}

/** Lưu nhanh một từ vào "Từ của tôi"; bộ chưa có thì tự tạo. */
export async function saveMyWord(
  _prevState: SaveWordState,
  formData: FormData,
): Promise<SaveWordState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Phiên đăng nhập đã hết hạn." };

  const term = String(formData.get("term") ?? "").trim();
  const meaning = String(formData.get("meaning_vi") ?? "").trim();
  const phonetic = optionalText(formData, "phonetic");
  const exampleEn = optionalText(formData, "example_en");
  const exampleVi = optionalText(formData, "example_vi");

  if (!term) return { error: "Nhập từ tiếng Anh đã nhé." };
  if (!meaning) return { error: "Thêm nghĩa tiếng Việt cho từ này." };
  if (term.length > MAX_TERM) return { error: `Từ tối đa ${MAX_TERM} ký tự.` };
  for (const value of [meaning, phonetic, exampleEn, exampleVi]) {
    if (value && value.length > MAX_TEXT) return { error: `Mỗi ô tối đa ${MAX_TEXT} ký tự.` };
  }

  const deck = await ensureMyDeck();
  if (!deck) return { error: "Không tạo được bộ Từ của tôi." };

  const supabase = await createClient();

  // Bảng words unique (deck_id, term): báo tử tế thay vì lỗi Postgres.
  const { data: clash } = await supabase
    .from("words")
    .select("id")
    .eq("deck_id", deck.id)
    .ilike("term", term)
    .maybeSingle();
  if (clash) return { error: `"${term}" đã có trong Từ của tôi rồi.` };

  const { data: last } = await supabase
    .from("words")
    .select("position")
    .eq("deck_id", deck.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("words").insert({
    deck_id: deck.id,
    term,
    meaning_vi: meaning,
    phonetic,
    example_en: exampleEn,
    example_vi: exampleVi,
    position: (last?.position ?? -1) + 1,
  });
  if (error) return { error: `Không lưu được: ${error.message}` };

  revalidateAll(deck.id);
  return { notice: `Đã lưu "${term}".` };
}

export async function removeMyWord(deckId: string, wordId: string) {
  const supabase = await createClient();
  // RLS chỉ cho xoá từ trong bộ của mình; tiến độ của từ mất theo (cascade).
  await supabase.from("words").delete().eq("id", wordId).eq("deck_id", deckId);
  revalidateAll(deckId);
}
