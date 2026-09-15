import Link from "next/link";
import { Mascot } from "@/app/_components/mascot";
import { ThemeButton } from "@/app/_components/theme-button";
import { UserBar } from "@/app/_components/user-bar";
import { getStudyStats } from "@/lib/stats";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getUserBarData } from "@/lib/user-bar";
import { LandingNav } from "./landing-nav";

/**
 * Thanh trên dùng chung cho trang giới thiệu và các trang thông tin.
 * Đã đăng nhập: tab chuyển tới các mục trong app + chuỗi/điểm danh/chuông/avatar.
 * Khách: tab nhảy mục trong trang + nút Đăng nhập. Admin: nút Quản trị.
 */
export async function LandingHeader({ showAnchors = false }: { showAnchors?: boolean }) {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: isAdmin } = user ? await supabase.rpc("is_admin") : { data: false };
  const learner = Boolean(user) && !isAdmin;

  const userBar = learner
    ? await (async () => {
        const [{ data: profile }, stats] = await Promise.all([
          supabase.from("profiles").select("display_name, avatar_url").maybeSingle(),
          getStudyStats(),
        ]);
        return getUserBarData(profile, stats);
      })()
    : null;

  return (
    <header className="bg-bg/80 sticky top-0 z-40 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/gioi-thieu" className="flex items-center gap-3">
          <Mascot variant="tot-nghiep" size={40} className="rounded-xl shadow-md shadow-blue-500/30" />
          <span className="from-brand bg-gradient-to-r to-violet-500 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            DailyEng
          </span>
        </Link>
        <LandingNav mode={learner ? "app" : showAnchors ? "anchors" : "pages"} />
        <div className="flex items-center gap-2">
          <ThemeButton className={userBar ? "hidden sm:flex" : ""} />
          {userBar ? (
            <UserBar data={userBar} />
          ) : (
            <Link
              href={isAdmin ? "/quan-tri" : "/dang-nhap"}
              className="bg-brand flex min-h-10 items-center rounded-full px-4 text-sm font-bold text-white press"
            >
              {isAdmin ? "Quản trị" : "Đăng nhập"}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
