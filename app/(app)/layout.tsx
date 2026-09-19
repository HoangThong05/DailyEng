import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BottomNav } from "@/app/_components/bottom-nav";
import { DuckChat } from "@/app/_components/duck-chat";
import { PageTransition } from "@/app/_components/page-transition";
import { SideNav } from "@/app/_components/side-nav";
import { AppShellProvider } from "@/app/_components/user-bar-context";
import { isAiEnabled } from "@/lib/ai";
import { type AppShellData, loadAppShell } from "@/lib/app-shell";

/**
 * Khung cho các màn cần đăng nhập.
 * Điện thoại: nội dung rộng cỡ màn hình + tab bar dưới đáy.
 * Màn hình lớn: sidebar trái cố định, nội dung giãn theo màn (tối đa 7xl ở
 * màn 2K) — lưới bên trong tự thêm cột, không để trống hai bên.
 *
 * Không await dữ liệu ở đây: khung được gửi ngay, các mảnh cần dữ liệu
 * (thẻ hồ sơ sidebar, cụm nút góc trên, vịt AI) tự treo trong Suspense của
 * riêng chúng; trang con hiện vịt "đang tải" (loading.tsx) trong lúc chờ.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  const shell = loadAppShell();

  return (
    <AppShellProvider promise={shell}>
      {/* Admin không phải người học: về thẳng khu quản trị. Chạy trong Suspense
          để không chặn khung; Next tự chuyển hướng phía client khi biết kết quả. */}
      <Suspense fallback={null}>
        <AdminGate promise={shell} />
      </Suspense>

      <div className="app-shell flex min-h-[100dvh] flex-col">
        <main className="pb-nav mx-auto flex w-full max-w-md flex-1 flex-col md:max-w-3xl md:pb-10 lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl">
          <PageTransition>{children}</PageTransition>
        </main>
        {isAiEnabled() ? (
          <Suspense fallback={null}>
            <DuckChat />
          </Suspense>
        ) : null}
        <BottomNav />
        <SideNav />
      </div>
    </AppShellProvider>
  );
}

async function AdminGate({ promise }: { promise: Promise<AppShellData> }) {
  const { isAdmin } = await promise;
  if (isAdmin) redirect("/quan-tri");
  return null;
}
