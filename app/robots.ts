import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Chặn các trang cần đăng nhập, mở phần công khai.
 *
 * Không dùng "Disallow: /" — nó chặn luôn địa chỉ gốc (chỗ mọi người hay dán
 * khi chia sẻ) và làm trình đọc thẻ của Facebook/Zalo trả 403. Khách chưa
 * đăng nhập vào "/" đã được chuyển sang /gioi-thieu nên để mở là đúng.
 */
const PRIVATE = [
  "/hoc",
  "/on-tap",
  "/kiem-tra-dau-vao",
  "/tro-choi",
  "/ky-nang",
  "/quiz",
  "/phat-am",
  "/tai-khoan",
  "/tien-do",
  "/xep-hang",
  "/phan-thuong",
  "/nguoi-dung",
  "/hoi-ai",
  "/quan-tri",
  "/dang-nhap",
  "/nhap-ma",
  "/auth",
  "/api",
];

/** Trình đọc thẻ chia sẻ của mạng xã hội — chỉ đọc meta, không lập chỉ mục. */
const SOCIAL_BOTS = [
  "facebookexternalhit",
  "facebookcatalog",
  "Facebot",
  "Twitterbot",
  "LinkedInBot",
  "Slackbot-LinkExpanding",
  "WhatsApp",
  "TelegramBot",
  "Discordbot",
  "zalo",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: SOCIAL_BOTS, allow: "/" },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
