import { countDueReviews } from "@/lib/decks";
import { getFriendNotices } from "@/lib/friends";
import { getLastAward } from "@/lib/season";
import { getSeedBalance } from "@/lib/seeds";
import { getCheckinState, type CheckinState } from "@/lib/rewards";
import type { StudyStats } from "@/lib/stats";
import { getDailyTasks } from "@/lib/tasks";

export type UserNotice = {
  /** Loại thông báo, ổn định trong ngày — dùng để nhớ "đã xem" (câu chữ có số, đổi liên tục). */
  key:
    | "diem-danh"
    | "den-han"
    | "nhiem-vu"
    | "nhiem-vu-xong"
    | "chuoi"
    | "ban-be"
    | "ban-be-dong-y"
    | "mua-giai";
  emoji: string;
  text: string;
  href: string;
  /** Tin vui, không phải việc cần làm: hiện trong danh sách nhưng không làm chuông đỏ. */
  quiet?: boolean;
};

/** Dữ liệu cho cụm nút góc trên: chuỗi, điểm danh, chuông, avatar. */
export type UserBarData = {
  name: string;
  avatarUrl: string | null;
  level: number;
  streak: number;
  checkin: CheckinState;
  notices: UserNotice[];
  /** Số dư Hạt 🌾 (schema-23); 0 nếu chưa có. */
  seeds: number;
};

/**
 * Chuông không lưu thông báo riêng — tự suy ra việc đang chờ từ dữ liệu:
 * chưa điểm danh, từ đến hạn, nhiệm vụ còn dở. Xong việc là mục biến mất.
 */
export async function getUserBarData(
  profile: { display_name: string | null; avatar_url: string | null } | null,
  stats: StudyStats,
): Promise<UserBarData> {
  const [checkin, dueReviews, tasks, seeds, friends, lastAward] = await Promise.all([
    getCheckinState(),
    countDueReviews(),
    getDailyTasks(),
    getSeedBalance(),
    getFriendNotices(),
    getLastAward(),
  ]);

  const notices: UserNotice[] = [];
  if (lastAward) {
    notices.push({
      key: "mua-giai",
      quiet: true,
      emoji: lastAward.rank === 1 ? "🏆" : "🎖️",
      text:
        lastAward.rank === 1
          ? `Bạn vô địch tuần rồi! +${lastAward.seeds} Hạt và danh hiệu Quán quân`
          : `Hạng ${lastAward.rank} tuần rồi · +${lastAward.seeds} Hạt`,
      href: "/xep-hang?tuan=truoc",
    });
  }
  if (friends.incoming > 0) {
    notices.push({
      key: "ban-be",
      emoji: "👋",
      text: `${friends.incoming} lời mời kết bạn`,
      href: "/ban-be",
    });
  }
  if (friends.accepted > 0) {
    notices.push({
      key: "ban-be-dong-y",
      emoji: "🤝",
      text:
        friends.accepted === 1
          ? "Lời mời kết bạn của bạn đã được đồng ý"
          : `${friends.accepted} người đã đồng ý kết bạn`,
      href: "/ban-be",
    });
  }
  if (!checkin.checkedToday) {
    notices.push({
      key: "diem-danh",
      emoji: "📅",
      text: `Chưa điểm danh hôm nay — nhận +${checkin.nextXp} XP`,
      href: "#diem-danh",
    });
  }
  if (dueReviews > 0) {
    notices.push({ key: "den-han", emoji: "🔁", text: `${dueReviews} từ đến hạn ôn lại`, href: "/on-tap" });
  }
  const remaining = tasks.tasks.filter((t) => !t.done).length;
  if (remaining > 0) {
    notices.push({
      key: "nhiem-vu",
      emoji: "✅",
      text: `Còn ${remaining} nhiệm vụ hôm nay`,
      href: "/#nhiem-vu",
    });
  } else if (tasks.allDone) {
    notices.push({ key: "nhiem-vu-xong", quiet: true, emoji: "🎉", text: `Xong nhiệm vụ hôm nay, +${tasks.earnedXp} XP`, href: "/#nhiem-vu" });
  }
  if (stats.today.words === 0) {
    notices.push({ key: "chuoi", emoji: "🔥", text: "Học vài từ để giữ chuỗi ngày", href: "/hoc" });
  }

  return {
    name: profile?.display_name ?? "Bạn",
    avatarUrl: profile?.avatar_url ?? null,
    level: stats.level.level,
    streak: stats.streak.current,
    checkin,
    notices,
    seeds,
  };
}
