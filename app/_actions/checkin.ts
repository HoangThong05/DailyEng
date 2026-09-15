"use server";

import { revalidatePath } from "next/cache";
import { checkInToday, type CheckinResult } from "@/lib/rewards";

/** Điểm danh hôm nay (nút ở thanh trên). */
export async function checkIn(): Promise<CheckinResult> {
  const result = await checkInToday();
  // Cấp độ, XP ở sidebar và trang chủ đổi theo.
  if (result.ok && result.xp > 0) revalidatePath("/", "layout");
  return result;
}
