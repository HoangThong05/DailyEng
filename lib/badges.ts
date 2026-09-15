import type { Json } from "@/lib/database.types";
import { CHECKIN_KEY, STREAK_KEY_PREFIX } from "@/lib/rewards";
import { getStudyStats, type StudyStats } from "@/lib/stats";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { ALL_DONE_KEY } from "@/lib/tasks";

/**
 * Huy hiệu: mốc thành tích tính từ dữ liệu học, không cộng XP (XP đã có ở
 * mốc chuỗi / nhiệm vụ). Đạt rồi thì giữ mãi — lưu vào profiles.badges để
 * bảng xếp hạng và trang cá nhân người khác hiện được.
 */

export type BadgeGroup = "chuoi" | "tu-vung" | "sieng-nang" | "ky-nang";

export type Badge = {
  key: string;
  title: string;
  description: string;
  emoji: string;
  group: BadgeGroup;
  /** Độ hiếm 1–3, để xếp thứ tự và tô màu. */
  tier: 1 | 2 | 3;
  earned: (facts: BadgeFacts) => boolean;
};

/** Mọi con số huy hiệu cần, gom một lần rồi tính. */
export type BadgeFacts = {
  streakLongest: number;
  wordsSeen: number;
  wordsMastered: number;
  reviews: number;
  level: number;
  checkins: number;
  fullTaskDays: number;
  mocks: number;
  /** Tỉ lệ đúng cao nhất trong các lần mock (0–1). */
  mockBest: number;
  placementDone: boolean;
};

export const BADGE_GROUPS: { key: BadgeGroup; label: string }[] = [
  { key: "chuoi", label: "Chuỗi ngày" },
  { key: "tu-vung", label: "Từ vựng" },
  { key: "sieng-nang", label: "Siêng năng" },
  { key: "ky-nang", label: "Kỹ năng" },
];

export const BADGES: Badge[] = [
  // Chuỗi
  { key: "chuoi-3", title: "Nhóm lửa", description: "Học 3 ngày liên tiếp", emoji: "🕯️", group: "chuoi", tier: 1, earned: (f) => f.streakLongest >= 3 },
  { key: "chuoi-7", title: "Một tuần bền", description: "Học 7 ngày liên tiếp", emoji: "🔥", group: "chuoi", tier: 1, earned: (f) => f.streakLongest >= 7 },
  { key: "chuoi-30", title: "Tháng không nghỉ", description: "Học 30 ngày liên tiếp", emoji: "🌋", group: "chuoi", tier: 2, earned: (f) => f.streakLongest >= 30 },
  { key: "chuoi-100", title: "Trăm ngày", description: "Học 100 ngày liên tiếp", emoji: "☄️", group: "chuoi", tier: 3, earned: (f) => f.streakLongest >= 100 },
  // Từ vựng
  { key: "tu-50", title: "Khởi động", description: "Đã học 50 từ", emoji: "🌱", group: "tu-vung", tier: 1, earned: (f) => f.wordsSeen >= 50 },
  { key: "tu-300", title: "Vốn liếng", description: "Đã học 300 từ", emoji: "🌿", group: "tu-vung", tier: 1, earned: (f) => f.wordsSeen >= 300 },
  { key: "tu-1000", title: "Nghìn từ", description: "Đã học 1.000 từ", emoji: "🌳", group: "tu-vung", tier: 2, earned: (f) => f.wordsSeen >= 1000 },
  { key: "thuoc-100", title: "Nhớ dai", description: "100 từ lên hộp 5", emoji: "🧠", group: "tu-vung", tier: 2, earned: (f) => f.wordsMastered >= 100 },
  { key: "thuoc-500", title: "Bộ nhớ thép", description: "500 từ lên hộp 5", emoji: "💎", group: "tu-vung", tier: 3, earned: (f) => f.wordsMastered >= 500 },
  // Siêng năng
  { key: "luot-100", title: "Trăm lượt", description: "100 lượt trả lời", emoji: "✏️", group: "sieng-nang", tier: 1, earned: (f) => f.reviews >= 100 },
  { key: "luot-1000", title: "Nghìn lượt", description: "1.000 lượt trả lời", emoji: "🖊️", group: "sieng-nang", tier: 2, earned: (f) => f.reviews >= 1000 },
  { key: "luot-5000", title: "Cày không mỏi", description: "5.000 lượt trả lời", emoji: "⚡", group: "sieng-nang", tier: 3, earned: (f) => f.reviews >= 5000 },
  { key: "diem-danh-7", title: "Có mặt", description: "Điểm danh 7 lần", emoji: "📅", group: "sieng-nang", tier: 1, earned: (f) => f.checkins >= 7 },
  { key: "diem-danh-30", title: "Đúng hẹn", description: "Điểm danh 30 lần", emoji: "🗓️", group: "sieng-nang", tier: 2, earned: (f) => f.checkins >= 30 },
  { key: "nhiem-vu-7", title: "Trọn ngày ×7", description: "Xong cả ba nhiệm vụ 7 ngày", emoji: "✅", group: "sieng-nang", tier: 2, earned: (f) => f.fullTaskDays >= 7 },
  { key: "cap-5", title: "Cấp 5", description: "Đạt cấp 5", emoji: "⭐", group: "sieng-nang", tier: 1, earned: (f) => f.level >= 5 },
  { key: "cap-10", title: "Cao thủ", description: "Đạt cấp 10", emoji: "🌟", group: "sieng-nang", tier: 2, earned: (f) => f.level >= 10 },
  { key: "cap-20", title: "Huyền thoại", description: "Đạt cấp 20", emoji: "👑", group: "sieng-nang", tier: 3, earned: (f) => f.level >= 20 },
  // Kỹ năng
  { key: "dau-vao", title: "Biết mình", description: "Làm kiểm tra đầu vào", emoji: "📋", group: "ky-nang", tier: 1, earned: (f) => f.placementDone },
  { key: "mock-1", title: "Thử sức", description: "Làm 1 đề mock test", emoji: "📝", group: "ky-nang", tier: 1, earned: (f) => f.mocks >= 1 },
  { key: "mock-10", title: "Quen đề", description: "Làm 10 đề mock test", emoji: "📚", group: "ky-nang", tier: 2, earned: (f) => f.mocks >= 10 },
  { key: "mock-85", title: "Điểm cao", description: "Một đề đúng từ 85%", emoji: "🏆", group: "ky-nang", tier: 3, earned: (f) => f.mockBest >= 0.85 },
];

export function badgeByKey(key: string) {
  return BADGES.find((badge) => badge.key === key) ?? null;
}

/** Đọc profiles.badges (jsonb) an toàn; chỉ giữ khoá còn tồn tại. */
export function parseBadgeKeys(value: Json | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && !!badgeByKey(item));
}

/** Huy hiệu đáng khoe nhất (tier cao trước) — cho bảng xếp hạng. */
export function topBadges(keys: string[], limit = 3): Badge[] {
  return keys
    .map(badgeByKey)
    .filter((badge): badge is Badge => badge !== null)
    .sort((a, b) => b.tier - a.tier)
    .slice(0, limit);
}

export type BadgeState = {
  earnedKeys: string[];
  /** Mới đạt trong lần đồng bộ này. */
  freshKeys: string[];
};

/**
 * Tính huy hiệu từ dữ liệu, so với profiles.badges, ghi thêm nếu có mới.
 * Gọi ở trang chủ và Cá nhân; không bao giờ gỡ huy hiệu đã có.
 */
export async function syncBadges(statsInput?: StudyStats): Promise<BadgeState> {
  const user = await getCurrentUser();
  if (!user) return { earnedKeys: [], freshKeys: [] };

  const supabase = await createClient();
  const [stats, { data: completions }, { data: mocks }, { data: profile }] = await Promise.all([
    statsInput ? Promise.resolve(statsInput) : getStudyStats(),
    supabase.from("task_completions").select("task_key, day"),
    supabase.from("mock_results").select("score, total"),
    supabase.from("profiles").select("badges, placement").eq("id", user.id).maybeSingle(),
  ]);

  const rows = completions ?? [];
  const mockRows = mocks ?? [];
  const facts: BadgeFacts = {
    streakLongest: stats.streak.longest,
    wordsSeen: stats.totals.wordsSeen,
    wordsMastered: stats.totals.wordsMastered,
    reviews: stats.totals.reviews,
    level: stats.level.level,
    checkins: rows.filter((r) => r.task_key === CHECKIN_KEY).length,
    fullTaskDays: rows.filter((r) => r.task_key === ALL_DONE_KEY).length,
    mocks: mockRows.length,
    mockBest: mockRows.reduce((best, r) => Math.max(best, r.total ? r.score / r.total : 0), 0),
    placementDone: !!profile?.placement,
  };
  // Mốc chuỗi đã thưởng cũng tính là bằng chứng (streak.longest có thể ngắn hơn
  // nếu nhật ký cũ bị xoá).
  for (const r of rows) {
    if (r.task_key.startsWith(STREAK_KEY_PREFIX)) {
      facts.streakLongest = Math.max(facts.streakLongest, Number(r.task_key.slice(STREAK_KEY_PREFIX.length)));
    }
  }

  const stored = parseBadgeKeys(profile?.badges);
  const earned = BADGES.filter((badge) => badge.earned(facts)).map((badge) => badge.key);
  const earnedKeys = [...new Set([...stored, ...earned])];
  const freshKeys = earned.filter((key) => !stored.includes(key));

  if (freshKeys.length > 0) {
    const { error } = await supabase.from("profiles").update({ badges: earnedKeys }).eq("id", user.id);
    if (error) console.error("badges:", error.message);
  }

  return { earnedKeys, freshKeys };
}
