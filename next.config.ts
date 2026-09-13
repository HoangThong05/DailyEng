import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Trang Tiến độ đã gộp vào Cá nhân; giữ link cũ cho người đã bookmark.
    return [{ source: "/tien-do", destination: "/tai-khoan", permanent: true }];
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

export default nextConfig;
