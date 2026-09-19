"use server";

import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export type OnboardState = {
  error?: string;
};

const MAX_NAME_LENGTH = 40;
const MIN_GOAL = 1;
const MAX_GOAL = 200;

/**
 * Chốt màn chào mừng: lưu tên + mục tiêu, đánh dấu đã qua, rồi đưa tới
 * kiểm tra đầu vào hoặc trang chủ tuỳ người dùng chọn.
 */
export async function finishOnboarding(
  _prevState: OnboardState,
  formData: FormData,
): Promise<OnboardState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Phiên đăng nhập đã hết hạn." };

  const displayName = String(formData.get("display_name") ?? "").trim();
  const dailyGoal = Number(formData.get("daily_goal"));
  const target = formData.get("target") === "kiem-tra" ? "/kiem-tra-dau-vao" : "/";

  if (!displayName) return { error: "Cho mình biết tên bạn nhé." };
  if (displayName.length > MAX_NAME_LENGTH) {
    return { error: `Tên tối đa ${MAX_NAME_LENGTH} ký tự.` };
  }
  if (!Number.isInteger(dailyGoal) || dailyGoal < MIN_GOAL || dailyGoal > MAX_GOAL) {
    return { error: `Mục tiêu phải từ ${MIN_GOAL} đến ${MAX_GOAL} từ mỗi ngày.` };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      daily_goal: dailyGoal,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) return { error: error.message };

  redirect(target);
}
