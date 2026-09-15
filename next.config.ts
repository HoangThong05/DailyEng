import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
