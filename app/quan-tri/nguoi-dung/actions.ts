"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Bật/tắt admin cho một người dùng. Hàm SQL tự kiểm tra người gọi là admin. */
export async function setAdmin(target: string, flag: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_admin", { target, flag });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/quan-tri/nguoi-dung");
  return { ok: true as const };
}
