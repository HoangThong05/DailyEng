import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/app/_components/service-worker-register";
import { SIDEBAR_INIT_SCRIPT } from "@/lib/sidebar-store";
import { OG_IMAGE, SITE } from "@/lib/site";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

// Inter có subset "vietnamese" nên dấu tiếng Việt hiển thị đúng.
const inter = Inter({
  variable: "--font-app-sans",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

// Inter thiếu ký tự IPA (ɪ ˈ iː ə ʃ…) nên phiên âm bị vá bằng font khác, chữ
// lệch nhau. Noto Sans có đủ; chỉ dùng cho dòng phiên âm qua class .ipa.
const notoSans = Noto_Sans({
  variable: "--font-ipa",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  display: "swap",
});

const DESCRIPTION =
  "Học từ vựng theo chặng, trò chơi ôn từ, luyện nghe nói và thi thử TOEIC. Miễn phí, chạy trên điện thoại và máy tính.";

export const metadata: Metadata = {
  // metadataBase để mọi đường dẫn ảnh trong thẻ chia sẻ thành URL tuyệt đối.
  metadataBase: new URL(SITE.url),
  title: {
    default: "DailyEng — Học tiếng Anh mỗi ngày",
    template: "%s · DailyEng",
  },
  description: DESCRIPTION,
  applicationName: "DailyEng",
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    title: "DailyEng",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    siteName: "DailyEng",
    locale: "vi_VN",
    title: "DailyEng — Học tiếng Anh mỗi ngày",
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "DailyEng — Học tiếng Anh mỗi ngày",
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
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
    <html lang="vi" className={`${inter.variable} ${notoSans.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: SIDEBAR_INIT_SCRIPT }} />
      </head>
      <body className="bg-bg text-fg min-h-[100dvh] font-sans antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
