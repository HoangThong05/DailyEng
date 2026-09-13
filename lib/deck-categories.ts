import type { DeckCategory } from "@/lib/database.types";

/**
 * Thông tin hiển thị của từng nhóm bộ từ. Thứ tự mảng = thứ tự hàng ở tab Học.
 * Bộ tự tạo luôn thuộc "khac" và hiện ở mục "Bộ của tôi" riêng.
 */
export const DECK_CATEGORIES: {
  key: DeckCategory;
  label: string;
  description: string;
  /** Gradient cho bìa bộ chưa có ảnh vẽ riêng. */
  gradient: string;
}[] = [
  {
    key: "toeic",
    label: "TOEIC",
    description: "Từ vựng theo chủ đề hay gặp trong đề thi",
    gradient: "from-indigo-500 to-blue-700",
  },
  {
    key: "cot-loi",
    label: "Từ vựng cốt lõi",
    description: "Những từ dùng nhiều nhất, học theo tần suất",
    gradient: "from-emerald-500 to-teal-700",
  },
  {
    key: "giao-tiep",
    label: "Giao tiếp",
    description: "Nói chuyện thường ngày",
    gradient: "from-amber-400 to-orange-600",
  },
  {
    key: "cong-viec",
    label: "Công việc & kinh doanh",
    description: "Email, họp, dự án, khách hàng",
    gradient: "from-sky-500 to-cyan-700",
  },
  {
    key: "hoc-thuat",
    label: "Học thuật",
    description: "Đọc hiểu và viết luận, IELTS",
    gradient: "from-fuchsia-500 to-purple-700",
  },
];

export function categoryOf(key: DeckCategory) {
  return DECK_CATEGORIES.find((category) => category.key === key);
}
