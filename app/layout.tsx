import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/app/_components/service-worker-register";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

// Inter có subset "vietnamese" nên dấu tiếng Việt hiển thị đúng.
const inter = Inter({
  variable: "--font-app-sans",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DailyEng — Học tiếng Anh mỗi ngày",
    template: "%s · DailyEng",
  },
  description:
    "Học tiếng Anh mỗi ngày với flashcard từ vựng, quiz trắc nghiệm và luyện phát âm.",
  applicationName: "DailyEng",
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    title: "DailyEng",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Tắt zoom để không bị double-tap zoom khi bấm nhanh (đánh đổi: mất pinch-zoom).
  maximumScale: 1,
  userScalable: false,
  // Cho phép nội dung tràn ra vùng tai thỏ, ta tự xử lý bằng safe-area.
  viewportFit: "cover",
  // Cố tình không khai themeColor ở đây: thẻ khai sẵn phải gắn kèm
  // media="(prefers-color-scheme)" nên luôn chạy theo hệ điều hành, đè mất
  // lựa chọn Sáng/Tối của người dùng. THEME_INIT_SCRIPT tự tạo và cập nhật thẻ
  // này ngay trong <head>, trước khi trình duyệt vẽ.
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning vì script bên dưới gắn thêm data-theme vào <html>
    // trước khi React hydrate — React phải chấp nhận DOM thay vì ghi đè lại.
    <html lang="vi" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-bg text-fg min-h-[100dvh] font-sans antialiased">
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
          {children}
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
