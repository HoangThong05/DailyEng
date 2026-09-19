import { MAX_BOX } from "@/lib/leitner";
import type { PathWord } from "@/lib/study-path";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

/** Số từ tải sẵn cho một lượt ôn offline. */
const PACK_SIZE = 60;

/**
 * Gói từ để ôn khi mất mạng: những từ đang học (chưa thuộc hẳn), gần hạn
 * nhất xếp trước. Client lưu vào localStorage khi còn mạng.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Bạn cần đăng nhập." }, { status: 401 });

  const supabase = await createClient();
  const { data: progress } = await supabase
    .from("word_progress")
    .select("word_id, box")
    .lt("box", MAX_BOX)
    .order("due_on")
    .limit(PACK_SIZE);

  const boxById = new Map((progress ?? []).map((row) => [row.word_id, row.box]));
  if (boxById.size === 0) return Response.json({ words: [] as PathWord[] });

  const { data: words } = await supabase
    .from("words")
    .select("id, term, phonetic, meaning_vi, example_en, example_vi")
    .in("id", [...boxById.keys()]);

  const order = [...boxById.keys()];
  const pack: PathWord[] = (words ?? [])
    .map((word) => ({ ...word, box: boxById.get(word.id) ?? 1 }))
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  return Response.json({ words: pack }, { headers: { "Cache-Control": "no-store" } });
}
