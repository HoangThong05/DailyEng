import { settleSeason } from "@/lib/season";
import { settleSeeds } from "@/lib/seeds";
import { getStudyStats } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import { getUserBarData, type UserBarData } from "@/lib/user-bar";

export type SideProfile = {
  name: string;
  avatarUrl: string | null;
  level: number;
  title: string;
  streak: number;
  /** 0–100 tiến độ tới cấp kế. */
  percent: number;
  frame: string | null;
};

export type AppShellData = {
  isAdmin: boolean;
  /** Người mới chưa qua màn chào mừng → layout đưa tới /chao-mung. */
  needsOnboarding: boolean;
  sideProfile: SideProfile;
  userBar: UserBarData;
};

/**
 * Mọi dữ liệu mà khung app (sidebar, cụm nút góc trên, vịt AI) cần.
 *
 * Trả về promise và KHÔNG await ở layout: layout gửi khung HTML ngay, các
 * mảnh cần dữ liệu tự `use()` promise này trong Suspense riêng. Nhờ vậy vừa
 * vào app là thấy sidebar + header + vịt đang tải, thay vì màn hình trống cho
 * tới khi mọi truy vấn xong.
 */
export async function loadAppShell(): Promise<AppShellData> {
  const supabase = await createClient();
  // Cộng Hạt mới, tự dùng Đóng băng chuỗi, và chốt mùa tuần trước nếu chưa.
  await Promise.all([settleSeeds(), settleSeason()]);
  const [{ data: isAdmin }, { data: profile }, stats] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase.from("profiles").select("display_name, avatar_url, onboarded_at, frame").maybeSingle(),
    getStudyStats(),
  ]);
  const userBar = await getUserBarData(profile, stats);

  return {
    isAdmin: Boolean(isAdmin),
    // Chỉ khi có hàng profile mà cột trống; không có hàng (trigger chưa chạy,
    // hoặc DB chưa chạy schema-22) thì không ép, tránh kẹt vòng chuyển hướng.
    needsOnboarding: profile !== null && profile.onboarded_at === null,
    sideProfile: {
      name: profile?.display_name ?? "Bạn",
      avatarUrl: profile?.avatar_url ?? null,
      level: stats.level.level,
      title: stats.level.title,
      streak: stats.streak.current,
      percent: stats.level.percent,
      frame: profile?.frame ?? null,
    },
    userBar,
  };
}
