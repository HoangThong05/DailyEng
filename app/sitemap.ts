import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/** Các trang công khai; trang cần đăng nhập không đưa vào (xem app/robots.ts). */
const PATHS = [
  { path: "/gioi-thieu", priority: 1 },
  { path: "/gioi-thieu/ve-dailyeng", priority: 0.8 },
  { path: "/gioi-thieu/tac-gia", priority: 0.5 },
  { path: "/gioi-thieu/gop-y", priority: 0.5 },
  { path: "/gioi-thieu/bao-mat", priority: 0.3 },
  { path: "/gioi-thieu/dieu-khoan", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PATHS.map(({ path, priority }) => ({
    url: `${SITE.url}${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority,
  }));
}
