import { addDays, MAX_BOX, todayInAppZone } from "@/lib/leitner";
import { computeStreak, type StreakInfo } from "@/lib/streak";
import { createClient } from "@/lib/supabase/server";
import { dailyAnswerXp, levelFromXp, type LevelInfo } from "@/lib/xp";

export const WEEK_LENGTH = 7;

export type DayBar = {
  day: string;
  label: string;
  reviews: number;
  isToday: boolean;
};

export type StudyStats = {
  streak: StreakInfo;
  level: LevelInfo;
  today: { reviews: number; words: number; correct: number };
  week: DayBar[];
  /** Mọi ngày có học (số lượt), cho bản đồ nhiệt ở Thống kê. */
  history: { day: string; reviews: number }[];
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
  const [daysResult, seenResult, masteredResult, taskResult] = await Promise.all([
    supabase.from("study_days").select("day, reviews, correct, words"),
    supabase
      .from("word_progress")
      .select("word_id", { count: "exact", head: true }),
    supabase
      .from("word_progress")
      .select("word_id", { count: "exact", head: true })
      .eq("box", MAX_BOX),
    // XP thưởng nhiệm vụ ngày (schema-15); chưa có bảng thì coi như 0.
    supabase.from("task_completions").select("xp"),
  ]);

  const days = daysResult.data ?? [];
  const taskXp = (taskResult.data ?? []).reduce((sum, row) => sum + row.xp, 0);
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
    // XP trả lời áp trần theo từng ngày (lib/xp.ts), cộng XP thưởng.
    level: levelFromXp(
      days.reduce((sum, row) => sum + dailyAnswerXp(row.correct, row.reviews - row.correct), 0) + taskXp,
    ),
    today: {
      reviews: todayRow?.reviews ?? 0,
      words: todayRow?.words ?? 0,
      correct: todayRow?.correct ?? 0,
    },
    week,
    history: days.map((row) => ({ day: row.day, reviews: row.reviews })),
    totals: {
      reviews,
      correct,
      accuracy: reviews > 0 ? Math.round((correct / reviews) * 100) : null,
      wordsSeen: seenResult.count ?? 0,
      wordsMastered: masteredResult.count ?? 0,
    },
  };
}
/** Tối đa bao nhiêu từ hiện ở mục "hay sai nhất". */
const HARDEST_LIMIT = 8;

export type HardWord = {
  wordId: string;
  term: string;
  meaning: string;
  deckName: string;
  wrong: number;
  reviews: number;
  box: number;
};

export type DeckAccuracy = {
  deckId: string;
  name: string;
  wordsSeen: number;
  wordsTotal: number;
  reviews: number;
  accuracy: number | null;
};

export type DetailedStats = {
  hardestWords: HardWord[];
  decks: DeckAccuracy[];
  /** Số từ ở từng hộp 1..MAX_BOX; index 0 là hộp 1. */
  boxes: number[];
};

/**
 * Thống kê chi tiết cho trang Tiến độ.
 *
 * Dựa trên word_progress (mỗi từ một hàng, đã cộng dồn số lượt) thay vì quét
 * review_log — rẻ hơn nhiều và đủ cho mọi con số ở đây.
 */
export async function getDetailedStats(): Promise<DetailedStats> {
  const supabase = await createClient();

  const [progressResult, wordsResult, decksResult] = await Promise.all([
    supabase
      .from("word_progress")
      .select("word_id, box, review_count, correct_count"),
    supabase.from("words").select("id, deck_id, term, meaning_vi"),
    supabase.from("decks").select("id, name, owner_id, position").order("position"),
  ]);

  const progress = progressResult.data ?? [];
  const words = wordsResult.data ?? [];
  const decks = decksResult.data ?? [];

  const wordById = new Map(words.map((word) => [word.id, word]));
  const deckById = new Map(decks.map((deck) => [deck.id, deck]));

  const boxes = Array.from({ length: MAX_BOX }, () => 0);
  const perDeck = new Map<
    string,
    { seen: number; reviews: number; correct: number }
  >();
  const hard: HardWord[] = [];

  for (const row of progress) {
    const word = wordById.get(row.word_id);
    if (!word) continue; // Từ đã bị xoá khỏi bộ sau khi học.

    boxes[row.box - 1] += 1;

    const deckEntry = perDeck.get(word.deck_id) ?? {
      seen: 0,
      reviews: 0,
      correct: 0,
    };
    deckEntry.seen += 1;
    deckEntry.reviews += row.review_count;
    deckEntry.correct += row.correct_count;
    perDeck.set(word.deck_id, deckEntry);

    const wrong = row.review_count - row.correct_count;
    if (wrong > 0) {
      hard.push({
        wordId: word.id,
        term: word.term,
        meaning: word.meaning_vi,
        deckName: deckById.get(word.deck_id)?.name ?? "",
        wrong,
        reviews: row.review_count,
        box: row.box,
      });
    }
  }

  // Sai nhiều lên trước; bằng nhau thì ưu tiên từ có tỉ lệ sai cao hơn.
  hard.sort(
    (a, b) => b.wrong - a.wrong || b.wrong / b.reviews - a.wrong / a.reviews,
  );

  const totalByDeck = new Map<string, number>();
  for (const word of words) {
    totalByDeck.set(word.deck_id, (totalByDeck.get(word.deck_id) ?? 0) + 1);
  }

  const deckStats: DeckAccuracy[] = decks
    .filter((deck) => perDeck.has(deck.id))
    .map((deck) => {
      const entry = perDeck.get(deck.id)!;
      return {
        deckId: deck.id,
        name: deck.name,
        wordsSeen: entry.seen,
        wordsTotal: totalByDeck.get(deck.id) ?? 0,
        reviews: entry.reviews,
        accuracy:
          entry.reviews > 0
            ? Math.round((entry.correct / entry.reviews) * 100)
            : null,
      };
    });

  return { hardestWords: hard.slice(0, HARDEST_LIMIT), decks: deckStats, boxes };
}

/**
 * Từ hay sai nhất, danh sách dài cho trang "Từ khó".
 * Cùng cách tính với getDetailedStats nhưng trả về nhiều hơn và có kèm phiên âm.
 */
export async function getHardWords(limit = 50): Promise<HardWord[]> {
  const supabase = await createClient();

  const [progressResult, wordsResult, decksResult] = await Promise.all([
    supabase
      .from("word_progress")
      .select("word_id, box, review_count, correct_count")
      .gt("review_count", 0),
    supabase.from("words").select("id, deck_id, term, meaning_vi"),
    supabase.from("decks").select("id, name"),
  ]);

  const wordById = new Map((wordsResult.data ?? []).map((word) => [word.id, word]));
  const deckById = new Map((decksResult.data ?? []).map((deck) => [deck.id, deck]));

  const hard: HardWord[] = [];
  for (const row of progressResult.data ?? []) {
    const word = wordById.get(row.word_id);
    if (!word) continue;
    const wrong = row.review_count - row.correct_count;
    if (wrong <= 0) continue;
    hard.push({
      wordId: word.id,
      term: word.term,
      meaning: word.meaning_vi,
      deckName: deckById.get(word.deck_id)?.name ?? "",
      wrong,
      reviews: row.review_count,
      box: row.box,
    });
  }

  hard.sort((a, b) => b.wrong - a.wrong || b.wrong / b.reviews - a.wrong / a.reviews);
  return hard.slice(0, limit);
}

/** Đếm số từ đang sai nhiều hơn đúng ít nhất một lần — cho thẻ gợi ý. */
export async function countHardWords(): Promise<number> {
  return (await getHardWords(200)).length;
}
