/**
 * Cửa hàng "Hạt" 🌾 — tiền riêng của DailyEng (vịt ăn hạt), tách khỏi XP.
 * XP là cấp độ, không tiêu được; Hạt là tiền, kiếm bằng thói quen học và
 * tiêu ở đây.
 *
 * Danh mục ở đây là NGUỒN SỰ THẬT về hình ảnh/nhãn; giá và loại được chép sang
 * bảng shop_items (schema-23) để hàm SQL kiểm giá — đổi giá thì đổi cả hai.
 */

export type ItemKind = "khung" | "bia" | "danh-hieu" | "dong-bang";

export type ShopItem = {
  key: string;
  kind: ItemKind;
  name: string;
  description: string;
  price: number;
  /** Có thì chỉ bán tới ngày này (YYYY-MM-DD, giờ VN); vật phẩm theo mùa. */
  limitedUntil?: string;
  /** Emoji nhỏ gắn góc khung / hoạ tiết bìa. */
  decor?: string;
  /** Tailwind gradient cho bìa hoặc màu viền khung. */
  gradient: string;
  /** Khung: có hiệu ứng xoay / nhấp nháy. */
  animated?: boolean;
};

export const SEED_EMOJI = "🌾";

/** Quy tắc kiếm Hạt — mọi thứ suy ra từ dữ liệu có sẵn (hàm SQL claim_seeds). */
export const SEED_RULES = [
  { emoji: "📅", text: "Điểm danh: +5 Hạt, ngày thứ 7 liên tiếp +20" },
  { emoji: "✅", text: "Xong đủ nhiệm vụ ngày: +10 Hạt" },
  { emoji: "🎯", text: "Đạt mục tiêu từ trong ngày: +5 Hạt" },
  { emoji: "🔥", text: "Mốc chuỗi 3/7/14/30/60/100 ngày: +20/50/100/200/400/700" },
  { emoji: "🏅", text: "Mỗi huy hiệu mới: +30 Hạt" },
] as const;

/** Số Đóng băng chuỗi được giữ cùng lúc. */
export const FREEZE_MAX = 2;

export const SHOP_ITEMS: ShopItem[] = [
  // --- Khung avatar (kiểu Discord: viền gradient, có cái xoay/nhấp nháy) ---
  { key: "khung-vang", kind: "khung", name: "Viền vàng", description: "Viền kim loại vàng, sang mà không chói.", price: 800, gradient: "from-amber-300 via-yellow-500 to-amber-600" },
  { key: "khung-lua", kind: "khung", name: "Viền lửa", description: "Cháy quanh avatar — hợp với chuỗi ngày dài.", price: 1200, gradient: "from-orange-400 via-red-500 to-yellow-400", animated: true, decor: "🔥" },
  { key: "khung-bang", kind: "khung", name: "Viền băng", description: "Xanh lạnh, lấp lánh như băng.", price: 1200, gradient: "from-cyan-200 via-sky-400 to-blue-500", decor: "❄️" },
  { key: "khung-cau-vong", kind: "khung", name: "Cầu vồng", description: "Bảy sắc xoay quanh avatar.", price: 2000, gradient: "from-pink-500 via-yellow-400 to-cyan-400", animated: true },
  { key: "khung-tot-nghiep", kind: "khung", name: "Tốt nghiệp", description: "Xanh navy viền vàng, có mũ cử nhân.", price: 1500, gradient: "from-indigo-800 via-blue-700 to-amber-400", decor: "🎓" },
  { key: "khung-trung-thu", kind: "khung", name: "Trung thu", description: "Đèn lồng đỏ, trăng vàng — chỉ bán mùa Trung thu.", price: 600, limitedUntil: "2026-10-15", gradient: "from-amber-400 via-orange-500 to-red-600", decor: "🏮" },
  { key: "khung-halloween", kind: "khung", name: "Halloween", description: "Cam tím ma mị, bí ngô góc khung.", price: 600, limitedUntil: "2026-11-05", gradient: "from-orange-500 via-purple-700 to-black", decor: "🎃" },
  { key: "khung-giang-sinh", kind: "khung", name: "Giáng sinh", description: "Đỏ xanh lá, tuyết rơi.", price: 600, limitedUntil: "2026-12-31", gradient: "from-red-500 via-emerald-500 to-red-600", decor: "🎄" },
  { key: "khung-tet", kind: "khung", name: "Tết", description: "Đỏ vàng may mắn, bao lì xì.", price: 600, limitedUntil: "2027-02-28", gradient: "from-red-600 via-amber-400 to-red-600", decor: "🧧" },

  // --- Ảnh bìa ---
  { key: "bia-trung-thu", kind: "bia", name: "Đêm trăng rằm", description: "Trăng tròn, đèn lồng — mùa Trung thu.", price: 500, limitedUntil: "2026-10-15", gradient: "from-indigo-900 via-purple-800 to-orange-500", decor: "🌕🏮" },
  { key: "bia-halloween", kind: "bia", name: "Đêm Halloween", description: "Tím đen, bí ngô và dơi.", price: 500, limitedUntil: "2026-11-05", gradient: "from-black via-purple-900 to-orange-600", decor: "🎃🦇" },
  { key: "bia-giang-sinh", kind: "bia", name: "Giáng sinh", description: "Tuyết, thông và quà.", price: 500, limitedUntil: "2026-12-31", gradient: "from-emerald-700 via-red-600 to-emerald-800", decor: "🎄🎁" },
  { key: "bia-tet", kind: "bia", name: "Tết", description: "Hoa mai, hoa đào, pháo hoa.", price: 500, limitedUntil: "2027-02-28", gradient: "from-red-600 via-amber-400 to-pink-500", decor: "🌸🎆" },
  { key: "bia-toeic-990", kind: "bia", name: "TOEIC 990", description: "Mục tiêu điểm tuyệt đối, treo lên cho nhớ.", price: 1200, gradient: "from-blue-900 via-blue-700 to-amber-400", decor: "🎯" },
  { key: "bia-ha-noi", kind: "bia", name: "Hà Nội", description: "Hồ Gươm chiều thu.", price: 900, gradient: "from-amber-200 via-orange-300 to-rose-400", decor: "🍂" },
  { key: "bia-sai-gon", kind: "bia", name: "Sài Gòn", description: "Đêm thành phố không ngủ.", price: 900, gradient: "from-fuchsia-600 via-purple-700 to-blue-800", decor: "🌃" },
  { key: "bia-vu-tru", kind: "bia", name: "Vũ trụ", description: "Sao và tinh vân.", price: 1500, gradient: "from-slate-900 via-indigo-800 to-fuchsia-700", decor: "🪐✨" },
  { key: "bia-bien", kind: "bia", name: "Biển", description: "Xanh ngọc, cát trắng.", price: 600, gradient: "from-cyan-300 via-teal-400 to-blue-500", decor: "🌊" },

  // --- Danh hiệu (hiện dưới tên ở bảng xếp hạng và trang cá nhân) ---
  { key: "dh-cu-dem", kind: "danh-hieu", name: "Cú đêm", description: "Học khuya mới vào.", price: 1000, gradient: "from-indigo-500 to-purple-600", decor: "🦉" },
  { key: "dh-mot-tu", kind: "danh-hieu", name: "Mọt từ", description: "Gặp từ nào cũng muốn nhớ.", price: 1000, gradient: "from-emerald-500 to-teal-600", decor: "📚" },
  { key: "dh-chien-binh", kind: "danh-hieu", name: "Chiến binh TOEIC", description: "Đang cày điểm.", price: 1500, gradient: "from-orange-500 to-red-600", decor: "⚔️" },
  { key: "dh-vit-vang", kind: "danh-hieu", name: "Vịt vàng", description: "Danh hiệu đắt nhất — khoe được.", price: 3000, gradient: "from-amber-400 to-yellow-600", decor: "🦆" },

  // --- Tiện ích ---
  { key: "dong-bang", kind: "dong-bang", name: "Đóng băng chuỗi", description: `Bỏ lỡ một ngày thì tự cứu chuỗi. Giữ tối đa ${FREEZE_MAX} cái.`, price: 500, gradient: "from-cyan-300 to-blue-500", decor: "❄️" },
];

export const KIND_LABEL: Record<ItemKind, string> = {
  khung: "Khung avatar",
  bia: "Ảnh bìa",
  "danh-hieu": "Danh hiệu",
  "dong-bang": "Tiện ích",
};

export function shopItem(key: string | null | undefined): ShopItem | undefined {
  return key ? SHOP_ITEMS.find((item) => item.key === key) : undefined;
}

/** Còn bán vào ngày `today` (YYYY-MM-DD) không. */
export function isOnSale(item: ShopItem, today: string) {
  return !item.limitedUntil || today <= item.limitedUntil;
}
