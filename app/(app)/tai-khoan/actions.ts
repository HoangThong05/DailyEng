"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export type ProfileState = {
  error?: string;
  notice?: string;
};

/** Khớp với ràng buộc check (daily_goal between 1 and 200) trong schema.sql. */
const MIN_GOAL = 1;
const MAX_GOAL = 200;
const MAX_NAME_LENGTH = 40;

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Phiên đăng nhập đã hết hạn." };

  const displayName = String(formData.get("display_name") ?? "").trim();
  const dailyGoal = Number(formData.get("daily_goal"));

  if (!displayName) return { error: "Tên hiển thị không được để trống." };
  if (displayName.length > MAX_NAME_LENGTH) {
    return { error: `Tên hiển thị tối đa ${MAX_NAME_LENGTH} ký tự.` };
  }
  if (
    !Number.isInteger(dailyGoal) ||
    dailyGoal < MIN_GOAL ||
    dailyGoal > MAX_GOAL
  ) {
    return { error: `Mục tiêu phải từ ${MIN_GOAL} đến ${MAX_GOAL} từ mỗi ngày.` };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, daily_goal: dailyGoal })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Home hiển thị cả tên lẫn mục tiêu nên phải làm mới theo.
  revalidatePath("/");
  revalidatePath("/tai-khoan");

  return { notice: "Đã lưu thay đổi." };
}