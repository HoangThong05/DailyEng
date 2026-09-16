/**
 * Thông tin tác giả và liên kết hiện ở footer. Điền/bỏ trống tuỳ ý:
 * link mạng xã hội nào rỗng thì footer tự ẩn.
 */
export const SITE = {
  name: "DailyEng",
  /**
   * Địa chỉ thật của trang, dùng cho thẻ chia sẻ (Open Graph) và sitemap.
   * Mua tên miền xong thì đặt NEXT_PUBLIC_SITE_URL trên Vercel, không cần sửa code.
   */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://daily-eng-omega.vercel.app").replace(/\/$/, ""),
  tagline: "Học tiếng Anh mỗi ngày: từ vựng, nghe, nói và luyện thi.",
  /** Email của app: liên hệ, góp ý, yêu cầu dữ liệu. Khác với email cá nhân của tác giả. */
  contactEmail: "dailyenglish78@gmail.com",
  author: {
    name: "Phan Hoàng Thông",
    role: "Sinh viên · tự xây DailyEng để học tiếng Anh mỗi ngày",
    email: "thong1582005@gmail.com",
  },
  social: {
    github: "https://github.com/HoangThong05",
    facebook: "https://www.facebook.com/phanhoangthong.1508/",
    linkedin: "",
    tiktok: "https://www.tiktok.com/@hthong.05",
    youtube: "https://www.youtube.com/@padoithong05",
  },
  repo: "https://github.com/HoangThong05/DailyEng",
};

/**
 * Ảnh xem trước khi chia sẻ link; sinh bằng scripts/render-og.py.
 * Để dưới /gioi-thieu/ vì đó là nhánh luôn được robots.txt cho phép — trình
 * đọc thẻ của Facebook/Zalo không bao giờ bị chặn dù nó cache robots cũ.
 */
export const OG_IMAGE = {
  url: "/gioi-thieu/og.png",
  width: 1200,
  height: 630,
  alt: "DailyEng — học tiếng Anh mỗi ngày cùng chú vịt vàng",
};
