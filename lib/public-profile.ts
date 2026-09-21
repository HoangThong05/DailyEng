import { parseBadgeKeys } from "@/lib/badges";
import { todayInAppZone } from "@/lib/leitner";
import { parseCover } from "@/lib/profile";
import { computeStreak } from "@/lib/streak";
import { createClient } from "@/lib/supabase/server";
import { levelFromXp } from "@/lib/xp";

export type PublicProfile = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  cover: ReturnType<typeof parseCover>;
  bio: string | null;
  badges: string[];
  xp: number;
  level: ReturnType<typeof levelFromXp>;
  wordsSeen: number;
  wordsMastered: number;
  reviews: number;
  streak: { current: number; longest: number };
  joinedAt: string;
  isMe: boolean;
  frame: string | null;
  title: string | null;
};

/** Trang cá nhân người khác; null nếu không có, đã ẩn, hoặc chưa chạy schema-18. */
export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const supabase = await createClient();
  const [{ data, error }, { data: auth }] = await Promise.all([
    supabase.rpc("public_profile", { target: userId }),
    supabase.auth.getUser(),
  ]);
  if (error) {
    console.error("public_profile:", error.message);
    return null;
  }
  const row = data?.[0];
  if (!row) return null;

  return {
    userId: row.user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    cover: parseCover(row.cover),
    frame: row.frame ?? null,
    title: row.title ?? null,
    bio: row.bio,
    badges: parseBadgeKeys(row.badges),
    xp: row.xp,
    level: levelFromXp(row.xp),
    wordsSeen: row.words_seen,
    wordsMastered: row.words_mastered,
    reviews: row.reviews,
    streak: computeStreak(row.recent_days ?? [], todayInAppZone()),
    joinedAt: row.joined_at,
    isMe: auth.user?.id === row.user_id,
  };
}
