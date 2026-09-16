import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Chỉ cho Google lập chỉ mục trang giới thiệu và các trang thông tin.
 * Mọi thứ cần đăng nhập đều chặn: nội dung riêng của từng người, không có gì
 * để hiện trên kết quả tìm kiếm.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/gioi-thieu"],
      disallow: [
        "/",
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
        "/auth",
        "/api",
      ],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
