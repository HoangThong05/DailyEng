import type { DeckCategory } from "@/lib/database.types";

/**
 * Thông tin hiển thị của từng nhóm bộ từ. Thứ tự mảng = thứ tự hàng ở tab Học.
 * Bộ tự tạo luôn thuộc "khac" và hiện ở mục "Bộ của tôi" riêng.
 *
 * Mỗi nhóm một màu riêng, dùng xuyên suốt: bìa, tiêu đề nhóm, thanh tiến độ,
 * nút trên thẻ — nhìn màu là biết nhóm. Class viết đầy đủ để Tailwind quét được.
 */
export type CategoryStyle = {
  key: DeckCategory;
  label: string;
  description: string;
  /** Gradient cho bìa bộ chưa có ảnh vẽ riêng. */
  gradient: string;
  /** Nền đậm: nút chính, badge đến hạn, thanh tiến độ. */
  solid: string;
  /** Nền nhạt + chữ màu: nút phụ, chip đếm. */
  soft: string;
  /** Nền rất nhạt cho thanh tiến độ. */
  track: string;
  /** Chấm màu / chữ màu. */
  text: string;
};

export const DECK_CATEGORIES: CategoryStyle[] = [
  {
    key: "toeic",
    label: "TOEIC",
    description: "Từ vựng theo chủ đề hay gặp trong đề thi",
    gradient: "from-orange-400 to-red-500",
    solid: "bg-orange-500 text-white",
    soft: "bg-orange-500/15 text-orange-600",
    track: "bg-orange-500/15",
    text: "text-orange-500",
  },
  {
    key: "cot-loi",
    label: "Từ vựng cốt lõi",
    description: "Những từ dùng nhiều nhất, học theo tần suất",
    gradient: "from-blue-500 to-indigo-600",
    solid: "bg-blue-500 text-white",
    soft: "bg-blue-500/15 text-blue-600",
    track: "bg-blue-500/15",
    text: "text-blue-500",
  },
  {
    key: "giao-tiep",
    label: "Giao tiếp",
    description: "Nói chuyện thường ngày",
    gradient: "from-emerald-400 to-green-600",
    solid: "bg-emerald-500 text-white",
    soft: "bg-emerald-500/15 text-emerald-600",
    track: "bg-emerald-500/15",
    text: "text-emerald-500",
  },
  {
    key: "cong-viec",
    label: "Công việc & kinh doanh",
    description: "Email, họp, dự án, khách hàng",
    gradient: "from-violet-500 to-purple-700",
    solid: "bg-violet-500 text-white",
    soft: "bg-violet-500/15 text-violet-600",
    track: "bg-violet-500/15",
    text: "text-violet-500",
  },
  {
    key: "hoc-thuat",
    label: "Học thuật",
    description: "Đọc hiểu và viết luận, IELTS",
    gradient: "from-cyan-500 to-sky-700",
    solid: "bg-cyan-500 text-white",
    soft: "bg-cyan-500/15 text-cyan-600",
    track: "bg-cyan-500/15",
    text: "text-cyan-500",
  },
];

export function categoryOf(key: DeckCategory | null | undefined) {
  return key ? DECK_CATEGORIES.find((category) => category.key === key) : undefined;
}
