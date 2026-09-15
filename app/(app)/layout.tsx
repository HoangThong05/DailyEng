import { BottomNav } from "@/app/_components/bottom-nav";
import { PageTransition } from "@/app/_components/page-transition";
import { SideNav } from "@/app/_components/side-nav";
import { SiteFooter } from "@/app/_components/site-footer";

/**
 * Khung cho các màn cần đăng nhập.
 * Điện thoại: nội dung rộng cỡ màn hình + tab bar dưới đáy.
 * Màn hình lớn: sidebar trái cố định, nội dung giãn theo màn (tối đa 7xl ở
 * màn 2K) — lưới bên trong tự thêm cột, không để trống hai bên.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-[100dvh] flex-col md:pl-60">
      <main className="pb-nav mx-auto flex w-full max-w-md flex-1 flex-col md:max-w-3xl md:pb-10 lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl">
        <PageTransition>{children}</PageTransition>
        <SiteFooter compact />
      </main>
      <BottomNav />
      <SideNav />
    </div>
  );
}
