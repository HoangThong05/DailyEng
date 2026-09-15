"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Đánh dấu góp ý đã xử lý / chưa. RLS chỉ cho admin cập nhật. */
export async function setFeedbackHandled(id: string, handled: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("feedback")
    .update({ handled })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/quan-tri");
  return { ok: true as const };
}
