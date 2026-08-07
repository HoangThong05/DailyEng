import { addDays, MAX_BOX, todayInAppZone } from "@/lib/leitner";
import { computeStreak, type StreakInfo } from "@/lib/streak";
import { createClient } from "@/lib/supabase/server";

export const WEEK_LENGTH = 7;

export type DayBar = {
  day: string;
  label: string;
  reviews: number;
  isToday: boolean;
};

export type StudyStats = {
  streak: StreakInfo;
  today: { reviews: number; words: number; correct: number };
  week: DayBar[];
  totals: {
    reviews: number;
    correct: number;
    accuracy: number | null;
    wordsSeen: number;
    wordsMastered: number;
  };
};

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function weekdayLabel(isoDay: string) {
  const [year, month, day] = isoDay.split("-").map(Number);
  return WEEKDAY_LABELS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

export async function getStudyStats(): Promise<StudyStats> {
  const supabase = await createClient();
  const today = todayInAppZone();

  // RLS đã giới hạn về đúng người dùng hiện tại nên không cần lọc user_id.
  const [daysResult, seenResult, masteredResult] = await Promise.all([
    supabase.from("study_days").select("day, reviews, correct, words"),
    supabase
      .from("word_progress")
      .select("word_id", { count: "exact", head: true }),
    supabase
      .from("word_progress")
      .select("word_id", { count: "exact", head: true })
      .eq("box", MAX_BOX),
  ]);

  const days = daysResult.data ?? [];
  const byDay = new Map(days.map((row) => [row.day, row]));

  const todayRow = byDay.get(today);

  // Dựng đủ 7 ô kể cả ngày không học, để biểu đồ không bị co lại.
  const week: DayBar[] = [];
  for (let offset = WEEK_LENGTH - 1; offset >= 0; offset--) {
    const day = addDays(today, -offset);
    week.push({
      day,
      label: weekdayLabel(day),
      reviews: byDay.get(day)?.reviews ?? 0,
      isToday: offset === 0,
    });
  }

  const reviews = days.reduce((sum, row) => sum + row.reviews, 0);
  const correct = days.reduce((sum, row) => sum + row.correct, 0);

  return {
    streak: computeStreak(
      days.map((row) => row.day),
      today,
    ),
    today: {
      reviews: todayRow?.reviews ?? 0,
      words: todayRow?.words ?? 0,
      correct: todayRow?.correct ?? 0,
    },
    week,
    totals: {
      reviews,
      correct,
      accuracy: reviews > 0 ? Math.round((correct / reviews) * 100) : null,
      wordsSeen: seenResult.count ?? 0,
      wordsMastered: masteredResult.count ?? 0,
    },
  };
}