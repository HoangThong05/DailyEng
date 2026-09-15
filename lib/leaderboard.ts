import { parseBadgeKeys } from "@/lib/badges";
import { createClient } from "@/lib/supabase/server";

export type LeaderboardPeriod = "week" | "all";

export type LeaderboardRow = {
  displayName: string;
  avatarUrl: string | null;
  /** Khoá huy hiệu đã đạt (schema-17); chưa chạy thì rỗng. */
  badges: string[];
  xp: number;
  rank: number;
  isMe: boolean;
};

/**
 * Top người học theo XP. Hàng của chính mình luôn có mặt (kể cả ngoài top)
 * để biết mình đang đứng đâu; chưa học gì thì không có hàng nào là mình.
 */
export async function getLeaderboard(
  period: LeaderboardPeriod,
  topN = 20,
): Promise<LeaderboardRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("leaderboard", {
    period,
    top_n: topN,
  });
  if (error) {
    // Chưa chạy schema-08 thì coi như bảng trống, không làm hỏng trang.
    console.error("leaderboard:", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    badges: parseBadgeKeys(row.badges),
    xp: row.xp,
    rank: row.rank,
    isMe: row.is_me,
  }));
}
