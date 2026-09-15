import { startOfTodayIso, todayInAppZone } from "@/lib/leitner";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

/**
 * Nhiệm vụ hằng ngày: 3 việc nhỏ, xong thì được XP thưởng. Mỗi ngày có
 * "Học 10 từ" cố định và 2 nhiệm vụ xoay vòng, để có lý do mở app ngoài chuỗi.
 *
 * Tiến độ tính từ dữ liệu đã có (review_log theo source, mock_results), không
 * cần ghi thêm gì lúc chơi. Hoàn thành thì ghi một dòng task_completions —
 * khoá chính chặn cộng trùng.
 */

/** Số liệu trong ngày, đủ để tính tiến độ mọi nhiệm vụ. */
export type DaySnapshot = {
  /** Số từ khác nhau đã trả lời (mọi nguồn). */
  words: number;
  correct: number;
  game: number;
  chepCauPassed: number;
  shadowingPassed: number;
  mocks: number;
};

export type TaskDef = {
  key: string;
  title: string;
  hint: string;
  target: number;
  xp: number;
  href: string;
  emoji: string;
  progress: (day: DaySnapshot) => number;
};

export const ALL_DONE_KEY = "hoan-thanh";
export const ALL_DONE_XP = 30;

const CORE: TaskDef = {
  key: "hoc-tu",
  title: "Học 10 từ",
  hint: "Học theo chặng hoặc ôn tập, từ nào cũng tính",
  target: 10,
  xp: 20,
  href: "/hoc",
  emoji: "📚",
  progress: (day) => day.words,
};

const ROTATING: TaskDef[] = [
  {
    key: "tra-loi-dung",
    title: "Trả lời đúng 15 lượt",
    hint: "Mọi hoạt động đều tính",
    target: 15,
    xp: 20,
    href: "/on-tap",
    emoji: "🎯",
    progress: (day) => day.correct,
  },
  {
    key: "tro-choi",
    title: "Chơi trò chơi 8 lượt",
    hint: "Quiz, ghép cặp, mưa từ, nghe gõ, nghe chọn hình",
    target: 8,
    xp: 20,
    href: "/tro-choi",
    emoji: "🎮",
    progress: (day) => day.game,
  },
  {
    key: "chep-cau",
    title: "Nghe chép đúng 3 câu",
    hint: "Kỹ năng → Nghe chép câu",
    target: 3,
    xp: 25,
    href: "/ky-nang/chep-cau",
    emoji: "🎧",
    progress: (day) => day.chepCauPassed,
  },
  {
    key: "shadowing",
    title: "Shadowing đạt 3 câu",
    hint: "Kỹ năng → Shadowing",
    target: 3,
    xp: 25,
    href: "/ky-nang/shadowing",
    emoji: "🎤",
    progress: (day) => day.shadowingPassed,
  },
  {
    key: "mock",
    title: "Làm 1 đề Part 5 mini",
    hint: "Kỹ năng → Mock test",
    target: 1,
    xp: 30,
    href: "/ky-nang/mock-test",
    emoji: "📝",
    progress: (day) => day.mocks,
  },
];

/** Số ngày kể từ mốc cố định, để chọn nhiệm vụ xoay vòng; cùng ngày ai cũng như nhau. */
function dayNumber(isoDay: string) {
  const [y, m, d] = isoDay.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function tasksForDay(isoDay: string): TaskDef[] {
  const n = dayNumber(isoDay);
  const first = n % ROTATING.length;
  // Lệch 1–3 nên luôn khác `first`.
  const second = (first + 1 + (n % 3)) % ROTATING.length;
  return [CORE, ROTATING[first], ROTATING[second]];
}

export type DailyTask = TaskDef & { current: number; done: boolean };

export type DailyTasks = {
  tasks: DailyTask[];
  allDone: boolean;
  /** XP thưởng đã nhận hôm nay (kể cả thưởng hoàn thành). */
  earnedXp: number;
  /** Tổng XP có thể nhận hôm nay. */
  possibleXp: number;
};

/**
 * Nhiệm vụ hôm nay kèm tiến độ; đồng thời ghi nhận những nhiệm vụ vừa xong.
 * Ghi ở đây (thay vì lúc chơi) để mọi hoạt động cũ mới đều được tính mà không
 * phải sửa từng trò chơi.
 */
export async function getDailyTasks(): Promise<DailyTasks> {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const today = todayInAppZone();
  const defs = tasksForDay(today);
  const possibleXp = defs.reduce((sum, t) => sum + t.xp, 0) + ALL_DONE_XP;

  if (!user) {
    return {
      tasks: defs.map((t) => ({ ...t, current: 0, done: false })),
      allDone: false,
      earnedXp: 0,
      possibleXp,
    };
  }

  const [{ data: reviews }, { count: mocks }, { data: completions }] =
    await Promise.all([
      supabase
        .from("review_log")
        .select("word_id, remembered, source")
        .eq("day", today),
      supabase
        .from("mock_results")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfTodayIso(today)),
      supabase.from("task_completions").select("task_key, xp").eq("day", today),
    ]);

  const rows = reviews ?? [];
  const snapshot: DaySnapshot = {
    words: new Set(rows.map((r) => r.word_id)).size,
    correct: rows.filter((r) => r.remembered).length,
    game: rows.filter((r) => r.source === "game").length,
    chepCauPassed: rows.filter((r) => r.source === "chep-cau" && r.remembered).length,
    shadowingPassed: rows.filter((r) => r.source === "shadowing" && r.remembered).length,
    mocks: mocks ?? 0,
  };

  const recorded = new Set((completions ?? []).map((c) => c.task_key));
  const tasks: DailyTask[] = defs.map((t) => {
    const current = Math.min(t.target, t.progress(snapshot));
    return { ...t, current, done: current >= t.target };
  });
  const allDone = tasks.every((t) => t.done);

  // Ghi những mốc mới đạt. Khoá chính (user, day, key) chặn trùng nếu hai
  // trang cùng render một lúc.
  const fresh = [
    ...tasks.filter((t) => t.done && !recorded.has(t.key)),
    ...(allDone && !recorded.has(ALL_DONE_KEY)
      ? [{ key: ALL_DONE_KEY, xp: ALL_DONE_XP }]
      : []),
  ].map((t) => ({ user_id: user.id, day: today, task_key: t.key, xp: t.xp }));

  if (fresh.length > 0) {
    const { error } = await supabase
      .from("task_completions")
      .upsert(fresh, { onConflict: "user_id,day,task_key", ignoreDuplicates: true });
    if (error) console.error("task_completions:", error.message);
  }

  const earnedXp =
    (completions ?? []).reduce((sum, c) => sum + c.xp, 0) +
    fresh.reduce((sum, c) => sum + c.xp, 0);

  return { tasks, allDone, earnedXp, possibleXp };
}
