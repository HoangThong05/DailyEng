import { addDays, todayInAppZone } from "@/lib/leitner";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { ALL_DONE_XP } from "@/lib/tasks";
import { XP_FORGOT, XP_REMEMBERED } from "@/lib/xp";

/**
 * Quy định thưởng của cả app. Mọi khoản thưởng đều ghi vào task_completions
 * (schema-15) với task_key riêng, nên cấp độ và bảng xếp hạng tự cộng.
 *
 *  - Điểm danh mỗi ngày         +10 XP, ngày thứ 7 liên tiếp +50 XP (rồi lặp)
 *  - Nhiệm vụ ngày              +20–30 XP mỗi việc, xong cả ba +30 XP
 *  - Mỗi lượt trả lời           nhớ +10, quên +3 (tính thẳng từ review_log)
 *  - Mốc chuỗi ngày học         3/7/14/30/60/100 ngày → thưởng một lần
 */

export const CHECKIN_KEY = "diem-danh";
export const CHECKIN_XP = 10;
export const CHECKIN_WEEK_XP = 50;
export const CHECKIN_CYCLE = 7;

/** [số ngày liên tiếp, XP thưởng một lần] */
export const STREAK_MILESTONES: [days: number, xp: number][] = [
  [3, 30],
  [7, 70],
  [14, 150],
  [30, 300],
  [60, 600],
  [100, 1000],
];

export const STREAK_KEY_PREFIX = "chuoi-";

/** XP cho lần điểm danh thứ `n` liên tiếp (n ≥ 1). */
export function checkinXpFor(n: number) {
  return n % CHECKIN_CYCLE === 0 ? CHECKIN_WEEK_XP : CHECKIN_XP;
}

/** Nhãn ngày trong tuần, thứ Hai đứng đầu như lịch Việt Nam. */
export const WEEK_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;

/** 0 = thứ Hai … 6 = Chủ nhật. */
function weekdayIndex(isoDay: string) {
  const [y, m, d] = isoDay.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export type CheckinDay = { day: string; label: string; checked: boolean; isToday: boolean };

export type CheckinState = {
  checkedToday: boolean;
  /** Số ngày điểm danh liên tiếp tính tới hôm nay (hoặc hôm qua nếu hôm nay chưa). */
  consecutive: number;
  /** Tuần này, thứ Hai → Chủ nhật. */
  week: CheckinDay[];
  /** XP sẽ nhận nếu điểm danh bây giờ; 0 khi đã điểm danh. */
  nextXp: number;
};

function buildCheckinState(checkedDays: Set<string>, today: string): CheckinState {
  const checkedToday = checkedDays.has(today);

  let consecutive = 0;
  let cursor = checkedToday ? today : addDays(today, -1);
  while (checkedDays.has(cursor)) {
    consecutive += 1;
    cursor = addDays(cursor, -1);
  }

  const monday = addDays(today, -weekdayIndex(today));
  const week = WEEK_LABELS.map((label, i) => {
    const day = addDays(monday, i);
    return { day, label, checked: checkedDays.has(day), isToday: day === today };
  });

  return {
    checkedToday,
    consecutive,
    week,
    nextXp: checkedToday ? 0 : checkinXpFor(consecutive + 1),
  };
}

export async function getCheckinState(): Promise<CheckinState> {
  const supabase = await createClient();
  const today = todayInAppZone();
  // Đủ xa để đếm chuỗi; ai điểm danh liên tục hơn 120 ngày thì chuỗi hiện 120+.
  const { data } = await supabase
    .from("task_completions")
    .select("day")
    .eq("task_key", CHECKIN_KEY)
    .gte("day", addDays(today, -120));
  return buildCheckinState(new Set((data ?? []).map((row) => row.day)), today);
}

export type CheckinResult =
  | { ok: true; xp: number; state: CheckinState }
  | { ok: false; error: string };

/** Điểm danh hôm nay; đã điểm danh rồi thì trả lại trạng thái, không cộng thêm. */
export async function checkInToday(): Promise<CheckinResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Phiên đăng nhập đã hết hạn." };

  const before = await getCheckinState();
  if (before.checkedToday) return { ok: true, xp: 0, state: before };

  const xp = before.nextXp;
  const supabase = await createClient();
  const { error } = await supabase
    .from("task_completions")
    .upsert(
      { user_id: user.id, day: todayInAppZone(), task_key: CHECKIN_KEY, xp },
      { onConflict: "user_id,day,task_key", ignoreDuplicates: true },
    );
  if (error) return { ok: false, error: error.message };

  return { ok: true, xp, state: await getCheckinState() };
}

/**
 * Thưởng mốc chuỗi ngày học vừa đạt (mỗi mốc một lần trong đời tài khoản).
 * Gọi ở trang chủ sau khi có streak; trả về các mốc mới để báo cho người dùng.
 */
export async function awardStreakMilestones(currentStreak: number) {
  const user = await getCurrentUser();
  if (!user || currentStreak < STREAK_MILESTONES[0][0]) return [] as number[];

  const supabase = await createClient();
  const { data } = await supabase
    .from("task_completions")
    .select("task_key")
    .like("task_key", `${STREAK_KEY_PREFIX}%`);
  const have = new Set((data ?? []).map((row) => row.task_key));

  const today = todayInAppZone();
  const fresh = STREAK_MILESTONES.filter(
    ([days]) => currentStreak >= days && !have.has(`${STREAK_KEY_PREFIX}${days}`),
  );
  if (fresh.length === 0) return [] as number[];

  const { error } = await supabase.from("task_completions").upsert(
    fresh.map(([days, xp]) => ({
      user_id: user.id,
      day: today,
      task_key: `${STREAK_KEY_PREFIX}${days}`,
      xp,
    })),
    { onConflict: "user_id,day,task_key", ignoreDuplicates: true },
  );
  if (error) console.error("streak milestones:", error.message);
  return fresh.map(([days]) => days);
}

/** Bảng quy định để hiện ở trang Phần thưởng. */
export const REWARD_RULES = [
  {
    title: "Điểm danh mỗi ngày",
    emoji: "📅",
    lines: [
      `Bấm điểm danh ở góc trên: +${CHECKIN_XP} XP`,
      `Ngày thứ ${CHECKIN_CYCLE} liên tiếp: +${CHECKIN_WEEK_XP} XP, rồi tính lại từ đầu`,
      "Bỏ một ngày là chuỗi điểm danh về 0",
    ],
  },
  {
    title: "Nhiệm vụ hằng ngày",
    emoji: "✅",
    lines: [
      "3 việc mỗi ngày ở trang chủ, mỗi việc +20–30 XP",
      `Xong cả ba: thưởng thêm +${ALL_DONE_XP} XP`,
    ],
  },
  {
    title: "Mỗi lượt trả lời",
    emoji: "🧠",
    lines: [
      `Nhớ: +${XP_REMEMBERED} XP · Quên: +${XP_FORGOT} XP`,
      "Học, ôn tập, trò chơi, kỹ năng đều tính",
    ],
  },
  {
    title: "Mốc chuỗi ngày học",
    emoji: "🔥",
    lines: STREAK_MILESTONES.map(([days, xp]) => `${days} ngày liên tiếp: +${xp} XP`),
    note: "Mỗi mốc thưởng một lần. Chỉ cần trả lời một từ là tính một ngày học.",
  },
] as const;
