/**
 * Bộ có sẵn nào đã có ảnh bìa vẽ riêng ở public/decks/<slug>.webp.
 *
 * Ảnh lưu WebP 1024px (≈100 KB) để repo nhẹ; PNG gốc 1–2 MB mỗi tấm.
 * Khai báo tay thay vì đọc thư mục lúc chạy: trên Vercel hàm server không
 * chắc thấy được public/, còn danh sách này thì chắc chắn. Thêm ảnh mới =
 * thả file vào public/decks rồi thêm slug vào đây.
 */
export const DECK_COVER_SLUGS = new Set([
  "giao-tiep-hang-ngay",
  "cong-viec-van-phong",
  "toeic-co-ban",
  "toeic-nhan-su",
  "toeic-tai-chinh",
  "toeic-marketing",
  "toeic-hop-dong",
  "toeic-hoi-hop",
  "toeic-du-lich",
  "toeic-nha-hang-khach-san",
  "toeic-san-xuat",
  "toeic-suc-khoe",
]);

/**
 * Ba ảnh đầu tiên đã vẽ sẵn tên bộ trong tranh nên không đè chữ lên.
 * Ảnh vẽ sau này để trống, code tự đè tên → không lo AI viết sai dấu.
 */
export const COVERS_WITH_TITLE = new Set([
  "giao-tiep-hang-ngay",
  "cong-viec-van-phong",
  "toeic-co-ban",
]);

/** Ảnh nền chung cho cả nhóm, dùng khi bộ chưa có ảnh riêng: public/decks/nhom-<category>.webp */
export const CATEGORY_COVER_KEYS = new Set<string>([
  "toeic",
  "cot-loi",
  "giao-tiep",
  "cong-viec",
  "hoc-thuat",
]);

export function deckCoverUrl(slug: string | null | undefined) {
  return slug && DECK_COVER_SLUGS.has(slug) ? `/decks/${slug}.webp` : null;
}

export function categoryCoverUrl(category: string | null | undefined) {
  return category && CATEGORY_COVER_KEYS.has(category)
    ? `/decks/nhom-${category}.webp`
    : null;
}
