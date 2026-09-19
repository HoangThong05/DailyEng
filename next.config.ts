import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ảnh bìa tải lên qua server action (đã thu nhỏ ở client, thường < 500 KB);
  // nới giới hạn mặc định 1 MB để ảnh nhiều chi tiết không bị chặn.
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  async redirects() {
    return [
      { source: "/bo-cua-toi", destination: "/tai-khoan", permanent: true },
      // Nghe chép câu và mock test chuyển sang tab Kỹ năng.
      { source: "/tro-choi/chep-cau/:path*", destination: "/ky-nang/chep-cau/:path*", permanent: true },
      { source: "/tro-choi/mock-test/:path*", destination: "/ky-nang/mock-test/:path*", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // Không cache service worker, nếu không người dùng sẽ kẹt ở bản SW cũ.
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

/**
 * Sentry: bọc config để bundle SDK đúng cách. Chỉ tải source map lên Sentry
 * khi có SENTRY_AUTH_TOKEN (đặt ở Vercel); local không cần.
 */
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  widenClientFileUpload: false,
});
