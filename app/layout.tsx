import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/app/_components/service-worker-register";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${inter.variable} h-full`}>
      <body className="bg-bg text-fg min-h-[100dvh] font-sans antialiased">
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
          {children}
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
