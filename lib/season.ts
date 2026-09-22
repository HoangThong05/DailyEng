import { parseBadgeKeys } from "@/lib/badges";
import { createClient } from "@/lib/supabase/server";

/**
 * Mùa giải tuần: thứ Hai → Chủ nhật (giờ VN). Hết Chủ nhật, top nhận Hạt;
 * hạng nhất thêm danh hiệu "Quán quân tuần". Xem supabase/schema-25.
 *
 * File này chỉ chạy ở server. Hằng số và hàm tính ngày ở lib/season-rules.ts
 * để client component dùng chung.
 */
export * from "@/lib/season-rules";

export type SeasonRow = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  badges: string[];
  frame: string | null;
  title: string | null;
  xp: number;
  rank: number;
  isMe: boolean;
};

/** Bảng xếp hạng của một tuần cố định. */
export async function getWeekBoard(monday: string, topN = 20): Promise<SeasonRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("week_leaderboard", {
    p_week_start: monday,
    top_n: topN,
  });
  if (error) {
    // Chưa chạy schema-25 thì coi như bảng trống, không làm hỏng trang.
    console.error("week_leaderboard:", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    badges: parseBadgeKeys(row.badges),
    frame: row.frame,
    title: row.title,
    xp: row.xp,
    rank: row.rank,
    isMe: row.is_me,
  }));
}

/**
 * Chốt mùa tuần trước nếu chưa chốt. Gọi khi nạp khung app; hàm SQL tự bỏ qua
 * nếu đã trao, nên chạy lại vô hại.
 */
export async function settleSeason() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("close_last_week");
  if (error) console.error("close_last_week:", error.message);
}

export type SeasonAward = { weekStart: string; rank: number; xp: number; seeds: number };

/** Thành tích mùa của chính mình. */
export async function getMyAwards(limit = 8): Promise<SeasonAward[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_season_awards", { limit_n: limit });
  if (error) return [];
  return (data ?? []).map((row) => ({
    weekStart: row.week_start,
    rank: row.rank,
    xp: row.xp,
    seeds: row.seeds,
  }));
}
