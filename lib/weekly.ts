import { addDays, todayInAppZone } from "@/lib/leitner";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

/**
 * Nhiệm vụ tuần (thứ Hai → Chủ nhật): nhịp "quay lại" dài hơn ngày. Hai việc
 * cố định, tiến độ suy từ study_days; xong thì ghi task_completions với khoá
 * mang ngày thứ Hai của tuần (mỗi tuần một lần). XP cộng vào cấp; Hạt cộng
 * qua claim_seeds (schema-23) theo khoá.
 */

export const WEEKLY_PREFIX = "tuan-";

export type WeeklyDef = {
  key: "hoc-5-ngay" | "200-luot";
  title: string;
  hint: string;
  target: number;
  xp: number;
  seeds: number;
  emoji: string;
};

export const WEEKLY_DEFS: WeeklyDef[] = [
  {
    key: "hoc-5-ngay",
    title: "Học 5 ngày trong tuần",
    hint: "Ngày nào có học là tính, không cần liên tiếp",
    target: 5,
    xp: 100,
    seeds: 50,
    emoji: "📆",
  },
  {
    key: "200-luot",
    title: "Trả lời 200 lượt trong tuần",
    hint: "Mọi hoạt động đều tính",
    target: 200,
    xp: 60,
    seeds: 30,
    emoji: "🏃",
  },
];

export type WeeklyQuest = WeeklyDef & { current: number; done: boolean };

export type WeeklyQuests = {
  quests: WeeklyQuest[];
  /** Thứ Hai của tuần này (YYYY-MM-DD). */
  monday: string;
  /** Số ngày còn lại tới hết Chủ nhật (kể cả hôm nay). */
  daysLeft: number;
};

/** 0 = thứ Hai … 6 = Chủ nhật. */
function weekdayIndex(isoDay: string) {
  const [y, m, d] = isoDay.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export function weeklyKey(def: WeeklyDef["key"], monday: string) {
  return `${WEEKLY_PREFIX}${def}-${monday}`;
}

export async function getWeeklyQuests(): Promise<WeeklyQuests> {
  const today = todayInAppZone();
  const monday = addDays(today, -weekdayIndex(today));
  const sunday = addDays(monday, 6);
  const daysLeft = 7 - weekdayIndex(today);

  const user = await getCurrentUser();
  if (!user) {
    return { quests: WEEKLY_DEFS.map((d) => ({ ...d, current: 0, done: false })), monday, daysLeft };
  }

  const supabase = await createClient();
  const [{ data: days }, { data: completions }] = await Promise.all([
    supabase.from("study_days").select("day, reviews").gte("day", monday).lte("day", sunday),
    supabase.from("task_completions").select("task_key").like("task_key", `${WEEKLY_PREFIX}%-${monday}`),
  ]);

  const rows = days ?? [];
  const progress: Record<WeeklyDef["key"], number> = {
    "hoc-5-ngay": rows.filter((r) => r.reviews > 0).length,
    "200-luot": rows.reduce((sum, r) => sum + r.reviews, 0),
  };

  const recorded = new Set((completions ?? []).map((c) => c.task_key));
  const quests: WeeklyQuest[] = WEEKLY_DEFS.map((d) => {
    const current = Math.min(d.target, progress[d.key]);
    return { ...d, current, done: current >= d.target };
  });

  const fresh = quests
    .filter((q) => q.done && !recorded.has(weeklyKey(q.key, monday)))
    .map((q) => ({ user_id: user.id, day: today, task_key: weeklyKey(q.key, monday), xp: q.xp }));
  if (fresh.length > 0) {
    const { error } = await supabase
      .from("task_completions")
      .upsert(fresh, { onConflict: "user_id,day,task_key", ignoreDuplicates: true });
    if (error) console.error("weekly quests:", error.message);
  }

  return { quests, monday, daysLeft };
}
