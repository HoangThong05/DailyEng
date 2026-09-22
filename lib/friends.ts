import { parseBadgeKeys } from "@/lib/badges";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

/** Quan hệ với một người: chưa gì, đã là bạn, họ mời mình, mình mời họ. */
export type FriendKind = "khong" | "ban" | "den" | "di";

export type Friend = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  frame: string | null;
  title: string | null;
  badges: string[];
  xp: number;
  /** Số ngày có học trong 60 ngày gần nhất (đủ để khoe độ chăm). */
  streakDays: number;
  studiedToday: boolean;
  kind: Exclude<FriendKind, "khong">;
  since: string;
};

export type FriendCircle = {
  friends: Friend[];
  /** Lời mời người khác gửi tới mình. */
  incoming: Friend[];
  /** Lời mời mình đã gửi, đang chờ. */
  outgoing: Friend[];
};

const EMPTY: FriendCircle = { friends: [], incoming: [], outgoing: [] };

export async function getFriendCircle(): Promise<FriendCircle> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("friend_list");
  if (error) {
    // Chưa chạy schema-24 thì coi như chưa có bạn nào, không làm hỏng trang.
    console.error("friend_list:", error.message);
    return EMPTY;
  }

  const rows: Friend[] = (data ?? []).map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    frame: row.frame,
    title: row.title,
    badges: parseBadgeKeys(row.badges),
    xp: row.xp,
    streakDays: row.streak_days,
    studiedToday: row.studied_today,
    kind: row.kind as Friend["kind"],
    since: row.since,
  }));

  return {
    friends: rows.filter((row) => row.kind === "ban"),
    incoming: rows.filter((row) => row.kind === "den"),
    outgoing: rows.filter((row) => row.kind === "di"),
  };
}

/** Mấy ngày vẫn còn báo "vừa đồng ý kết bạn" trên chuông. */
const ACCEPTED_WINDOW_DAYS = 3;

export type FriendNotices = {
  /** Lời mời đang chờ mình trả lời. */
  incoming: number;
  /** Lời mời mình gửi vừa được đồng ý (trong vài ngày gần đây). */
  accepted: number;
};

/** Số liệu cho chuông thông báo. */
export async function getFriendNotices(): Promise<FriendNotices> {
  const user = await getCurrentUser();
  if (!user) return { incoming: 0, accepted: 0 };

  const since = new Date(Date.now() - ACCEPTED_WINDOW_DAYS * 86_400_000).toISOString();
  const supabase = await createClient();
  const [incoming, accepted] = await Promise.all([
    supabase
      .from("friendships")
      .select("requester", { count: "exact", head: true })
      .eq("addressee", user.id)
      .eq("status", "pending"),
    supabase
      .from("friendships")
      .select("addressee", { count: "exact", head: true })
      .eq("requester", user.id)
      .eq("status", "accepted")
      .gte("responded_at", since),
  ]);

  return { incoming: incoming.count ?? 0, accepted: accepted.count ?? 0 };
}

/** Quan hệ giữa mình và một người, cho nút ở trang cá nhân của họ. */
export async function getFriendStatus(targetId: string): Promise<FriendKind> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("friend_status", { target: targetId });
  if (error || typeof data !== "string") return "khong";
  return data as FriendKind;
}

export type FriendRankRow = {
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

/** Xếp hạng XP trong nhóm bạn bè (kể cả mình). */
export async function getFriendLeaderboard(period: "week" | "all"): Promise<FriendRankRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("friend_leaderboard", { period });
  if (error) {
    console.error("friend_leaderboard:", error.message);
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
