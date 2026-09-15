"use server";

import { revalidatePath } from "next/cache";
import { LEVELS, type PlacementResult } from "@/lib/placement";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export type SaveResult = { ok: true } | { ok: false; error: string };

/** Lưu kết quả kiểm tra đầu vào vào hồ sơ (ghi đè lần trước). */
export async function savePlacement(result: PlacementResult): Promise<SaveResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Phiên đăng nhập đã hết hạn." };
  if (!LEVELS.includes(result.level) || typeof result.score !== "number") {
    return { ok: false, error: "Kết quả không hợp lệ." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ placement: { ...result, takenAt: new Date().toISOString() } })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/hoc");
  revalidatePath("/");
  return { ok: true };
}
