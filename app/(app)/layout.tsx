import { redirect } from "next/navigation";
import { BottomNav } from "@/app/_components/bottom-nav";
import { PageTransition } from "@/app/_components/page-transition";
import { SideNav } from "@/app/_components/side-nav";
import { getStudyStats } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

/**
 * Khung cho các màn cần đăng nhập.
 * Điện thoại: nội dung rộng cỡ màn hình + tab bar dưới đáy.
 * Màn hình lớn: sidebar trái cố định, nội dung giãn theo màn (tối đa 7xl ở
 * màn 2K) — lưới bên trong tự thêm cột, không để trống hai bên.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Admin không phải người học: đăng nhập là vào thẳng khu quản trị,
  // không có trang chủ, tiến độ hay bảng xếp hạng cá nhân.
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin) redirect("/quan-tri");

  // Thẻ hồ sơ dưới sidebar: tên, cấp, chuỗi ngày.
  const [{ data: profile }, stats] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url").maybeSingle(),
    getStudyStats(),
  ]);
  const sideProfile = {
    name: profile?.display_name ?? "Bạn",
    avatarUrl: profile?.avatar_url ?? null,
    level: stats.level.level,
    title: stats.level.title,
    streak: stats.streak.current,
    percent: stats.level.percent,
  };

  return (
    <div className="flex min-h-[100dvh] flex-col md:pl-60">
      <main className="pb-nav mx-auto flex w-full max-w-md flex-1 flex-col md:max-w-3xl md:pb-10 lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
      <SideNav profile={sideProfile} />
    </div>
  );
}
