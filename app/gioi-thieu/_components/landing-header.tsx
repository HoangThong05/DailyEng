import Link from "next/link";
import { Mascot } from "@/app/_components/mascot";
import { ThemeButton } from "@/app/_components/theme-button";
import { getCurrentUser } from "@/lib/supabase/server";

/** Thanh trên dùng chung cho trang giới thiệu và các trang thông tin. */
export async function LandingHeader({ showAnchors = false }: { showAnchors?: boolean }) {
  const user = await getCurrentUser();
  return (
    <header className="bg-bg/80 sticky top-0 z-40 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/gioi-thieu" className="flex items-center gap-3">
          <Mascot variant="tot-nghiep" size={40} className="rounded-xl shadow-md shadow-blue-500/30" />
          <span className="from-brand bg-gradient-to-r to-violet-500 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            DailyEng
          </span>
        </Link>
        {showAnchors ? (
          <nav className="text-muted hidden items-center gap-6 text-sm font-semibold md:flex">
            <a href="#tinh-nang" className="hover:text-fg">Tính năng</a>
            <a href="#tro-choi" className="hover:text-fg">Trò chơi</a>
            <a href="#bo-tu" className="hover:text-fg">Bộ từ</a>
          </nav>
        ) : (
          <nav className="text-muted hidden items-center gap-6 text-sm font-semibold md:flex">
            <Link href="/gioi-thieu" className="hover:text-fg">Trang giới thiệu</Link>
          </nav>
        )}
        <div className="flex items-center gap-2">
          <ThemeButton />
          <Link
            href={user ? "/" : "/dang-nhap"}
            className="bg-brand flex min-h-10 items-center rounded-full px-4 text-sm font-bold text-white press"
          >
            {user ? "Vào học" : "Đăng nhập"}
          </Link>
        </div>
      </div>
    </header>
  );
}
