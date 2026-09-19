import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DEFAULT_REMINDER_HOUR } from "@/lib/reminder";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./wizard";

export const metadata: Metadata = { title: "Chào mừng" };

/**
 * Màn chào mừng người mới: tên, mục tiêu mỗi ngày, nhắc học, rồi chọn làm
 * kiểm tra đầu vào hay vào học luôn. Đã qua rồi thì về trang chủ.
 */
export default async function ChaoMungPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, daily_goal, reminder_hour, onboarded_at")
    .maybeSingle();

  if (!profile || profile.onboarded_at) redirect("/");

  return (
    <main className="pt-safe pb-safe flex flex-1 flex-col justify-center px-6 py-10">
      <OnboardingWizard
        initialName={profile.display_name ?? ""}
        initialGoal={profile.daily_goal}
        reminderHour={profile.reminder_hour ?? DEFAULT_REMINDER_HOUR}
        vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
      />
    </main>
  );
}
