/**
 * Cửa hàng "Hạt" 🌾 — tiền riêng của DailyEng (vịt ăn hạt), tách khỏi XP.
 * XP là cấp độ, không tiêu được; Hạt là tiền, kiếm bằng thói quen học và
 * tiêu ở đây.
 *
 * Danh mục ở đây là NGUỒN SỰ THẬT về hình ảnh/nhãn; giá và loại được chép sang
 * bảng shop_items (schema-23) để hàm SQL kiểm giá — đổi giá thì đổi cả hai.
 */

export type ItemKind = "khung" | "bia" | "danh-hieu" | "dong-bang";

/**
 * Cảnh vẽ bằng code cho bìa: nền trời, có trăng/sao/đồi không, và các emoji
 * đặt ở toạ độ cố định (% ngang, % dọc, cỡ rem). Thay bằng ảnh thật khi có
 * file public/shop/<key>.webp (đặt art: true).
 */
export type Scene = {
  sky: string;
  moon?: { x: number; y: number; size: number; color: string };
  stars?: number;
  hills?: string;
  snow?: boolean;
  props?: { glyph: string; x: number; y: number; size: number; float?: boolean }[];
};

/** Khung avatar vẽ bằng SVG: vòng gradient + hoạ tiết bám quanh vòng. */
export type FrameArt = {
  colors: [string, string, string];
  /** Emoji bám quanh vòng; góc tính bằng độ (0 = trên cùng, thuận chiều kim đồng hồ). */
  charms?: { glyph: string; angle: number; size: number }[];
  /** Hiệu ứng: xoay vòng, lửa liếm, phát sáng nhẹ, tuyết rơi. */
  effect?: "spin" | "flame" | "glow" | "snow";
};

export type ShopItem = {
  key: string;
  kind: ItemKind;
  name: string;
  description: string;
  price: number;
  /** Có thì chỉ bán tới ngày này (YYYY-MM-DD, giờ VN); vật phẩm theo mùa. */
  limitedUntil?: string;
  /** Emoji đại diện (danh hiệu, tiện ích). */
  decor?: string;
  /** Tailwind gradient: nền dự phòng của bìa, màu danh hiệu / tiện ích. */
  gradient: string;
  /** Khung: cách vẽ. */
  frame?: FrameArt;
  /** Bìa: cảnh vẽ bằng code. */
  scene?: Scene;
  /** Bìa: có file ảnh thật public/shop/<key>.webp (1200×400). */
  art?: boolean;
  /** Thuộc bộ sưu tập theo mùa nào (COLLECTIONS). */
  collection?: string;
};

export type Collection = {
  key: string;
  name: string;
  tagline: string;
  until: string;
  scene: Scene;
  /** Banner dùng ảnh public/shop/<art>.webp thay cho cảnh vẽ. */
  art?: string;
};

/** Bộ sưu tập theo mùa: cửa hàng hiện banner bộ đang mở bán. */
export const COLLECTIONS: Collection[] = [
  {
    key: "trung-thu",
    name: "Đêm rằm Trung thu",
    tagline: "Đèn lồng, trăng tròn và bánh nướng — chỉ bán tới 15/10.",
    until: "2026-10-15",
    art: "bia-trung-thu",
    scene: {
      sky: "linear-gradient(180deg,#0b1030 0%,#2a1a5e 55%,#7c3a12 100%)",
      moon: { x: 78, y: 30, size: 22, color: "#ffd166" },
      stars: 40,
      hills: "#120a26",
      props: [
        { glyph: "🏮", x: 12, y: 18, size: 3.2, float: true },
        { glyph: "🏮", x: 22, y: 8, size: 2.4, float: true },
        { glyph: "🥮", x: 40, y: 66, size: 2.4 },
        { glyph: "🐇", x: 58, y: 70, size: 2.6 },
        { glyph: "🎋", x: 92, y: 62, size: 3 },
      ],
    },
  },
  {
    key: "halloween",
    name: "Đêm Halloween",
    tagline: "Bí ngô, dơi và trăng máu — tới 5/11.",
    until: "2026-11-05",
    scene: {
      sky: "linear-gradient(180deg,#05030f 0%,#2b0a3d 60%,#7a2a05 100%)",
      moon: { x: 24, y: 28, size: 20, color: "#ff8c42" },
      stars: 25,
      hills: "#0a0514",
      props: [
        { glyph: "🦇", x: 40, y: 18, size: 2, float: true },
        { glyph: "🦇", x: 52, y: 30, size: 1.5, float: true },
        { glyph: "🎃", x: 70, y: 66, size: 3 },
        { glyph: "🕸️", x: 92, y: 10, size: 2.6 },
        { glyph: "👻", x: 84, y: 40, size: 2.2, float: true },
      ],
    },
  },
  {
    key: "giang-sinh",
    name: "Giáng sinh",
    tagline: "Tuyết rơi, thông và quà — tới 31/12.",
    until: "2026-12-31",
    scene: {
      sky: "linear-gradient(180deg,#0a1e3a 0%,#123a5c 60%,#1c5a4a 100%)",
      stars: 30,
      snow: true,
      hills: "#e8f1f8",
      props: [
        { glyph: "🎄", x: 14, y: 52, size: 3.4 },
        { glyph: "🎁", x: 32, y: 70, size: 2.2 },
        { glyph: "⛄", x: 76, y: 60, size: 2.8 },
        { glyph: "🛷", x: 90, y: 22, size: 2.2, float: true },
      ],
    },
  },
  {
    key: "tet",
    name: "Tết",
    tagline: "Hoa mai, hoa đào, pháo hoa — tới 28/2.",
    until: "2027-02-28",
    scene: {
      sky: "linear-gradient(180deg,#5b0a0a 0%,#b3261e 55%,#f2a900 100%)",
      stars: 15,
      props: [
        { glyph: "🎆", x: 20, y: 18, size: 3, float: true },
        { glyph: "🎆", x: 70, y: 12, size: 2.4, float: true },
        { glyph: "🌸", x: 10, y: 62, size: 2.6 },
        { glyph: "🌼", x: 88, y: 58, size: 2.6 },
        { glyph: "🧧", x: 50, y: 66, size: 2.4 },
      ],
    },
  },
];

export function collectionByKey(key: string | undefined) {
  return key ? COLLECTIONS.find((c) => c.key === key) : undefined;
}

const SCENE = Object.fromEntries(COLLECTIONS.map((c) => [c.key, c.scene])) as Record<string, Scene>;

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
  // --- Khung avatar (SVG: vòng gradient + hoạ tiết bám quanh; kiểu Discord) ---
  { key: "khung-vang", kind: "khung", name: "Viền vàng", description: "Vòng kim loại vàng chạm khắc, sang mà không chói.", price: 800, gradient: "from-amber-300 via-yellow-500 to-amber-600",
    frame: { colors: ["#fde68a", "#f59e0b", "#b45309"], effect: "glow", charms: [{ glyph: "✦", angle: 0, size: 0.9 }, { glyph: "✦", angle: 120, size: 0.7 }, { glyph: "✦", angle: 240, size: 0.7 }] } },
  { key: "khung-lua", kind: "khung", name: "Viền lửa", description: "Lửa liếm quanh avatar — hợp với chuỗi ngày dài.", price: 1200, gradient: "from-orange-400 via-red-500 to-yellow-400",
    frame: { colors: ["#fbbf24", "#ef4444", "#7c2d12"], effect: "flame", charms: [{ glyph: "🔥", angle: 315, size: 1.1 }, { glyph: "🔥", angle: 45, size: 1.1 }, { glyph: "🔥", angle: 0, size: 1.3 }] } },
  { key: "khung-bang", kind: "khung", name: "Viền băng", description: "Xanh lạnh, băng đọng quanh vòng.", price: 1200, gradient: "from-cyan-200 via-sky-400 to-blue-500",
    frame: { colors: ["#e0f2fe", "#38bdf8", "#1d4ed8"], effect: "glow", charms: [{ glyph: "❄️", angle: 0, size: 1 }, { glyph: "❄️", angle: 135, size: 0.8 }, { glyph: "❄️", angle: 225, size: 0.8 }, { glyph: "🧊", angle: 180, size: 0.8 }] } },
  { key: "khung-cau-vong", kind: "khung", name: "Cầu vồng", description: "Bảy sắc xoay chậm quanh avatar.", price: 2000, gradient: "from-pink-500 via-yellow-400 to-cyan-400",
    frame: { colors: ["#f472b6", "#facc15", "#22d3ee"], effect: "spin" } },
  { key: "khung-tot-nghiep", kind: "khung", name: "Tốt nghiệp", description: "Vòng nguyệt quế xanh navy viền vàng, có mũ cử nhân.", price: 1500, gradient: "from-indigo-800 via-blue-700 to-amber-400",
    frame: { colors: ["#1e3a8a", "#3b82f6", "#fbbf24"], effect: "glow", charms: [{ glyph: "🎓", angle: 0, size: 1.3 }, { glyph: "🌿", angle: 250, size: 1 }, { glyph: "🌿", angle: 110, size: 1 }] } },
  { key: "khung-trung-thu", kind: "khung", name: "Trung thu", description: "Đèn lồng treo quanh, trăng vàng phía trên — chỉ bán mùa Trung thu.", price: 400, limitedUntil: "2026-10-15", collection: "trung-thu", gradient: "from-amber-400 via-orange-500 to-red-600",
    frame: { colors: ["#fcd34d", "#f97316", "#7f1d1d"], effect: "glow", charms: [{ glyph: "🌕", angle: 0, size: 1.2 }, { glyph: "🏮", angle: 300, size: 1.1 }, { glyph: "🏮", angle: 60, size: 1.1 }, { glyph: "🏮", angle: 180, size: 0.9 }] } },
  { key: "khung-halloween", kind: "khung", name: "Halloween", description: "Cam tím ma mị, bí ngô và dơi bám quanh.", price: 400, limitedUntil: "2026-11-05", collection: "halloween", gradient: "from-orange-500 via-purple-700 to-black",
    frame: { colors: ["#fb923c", "#7e22ce", "#0f0716"], effect: "glow", charms: [{ glyph: "🎃", angle: 0, size: 1.3 }, { glyph: "🦇", angle: 290, size: 1 }, { glyph: "🦇", angle: 70, size: 1 }, { glyph: "🕸️", angle: 180, size: 0.9 }] } },
  { key: "khung-giang-sinh", kind: "khung", name: "Giáng sinh", description: "Đỏ xanh lá, tuyết rơi quanh vòng.", price: 400, limitedUntil: "2026-12-31", collection: "giang-sinh", gradient: "from-red-500 via-emerald-500 to-red-600",
    frame: { colors: ["#fecaca", "#dc2626", "#047857"], effect: "snow", charms: [{ glyph: "🎄", angle: 0, size: 1.2 }, { glyph: "🎁", angle: 120, size: 0.9 }, { glyph: "🔔", angle: 240, size: 0.9 }] } },
  { key: "khung-tet", kind: "khung", name: "Tết", description: "Đỏ vàng may mắn, hoa mai và bao lì xì.", price: 400, limitedUntil: "2027-02-28", collection: "tet", gradient: "from-red-600 via-amber-400 to-red-600",
    frame: { colors: ["#fde68a", "#dc2626", "#991b1b"], effect: "glow", charms: [{ glyph: "🧧", angle: 0, size: 1.2 }, { glyph: "🌸", angle: 300, size: 1 }, { glyph: "🌼", angle: 60, size: 1 }, { glyph: "🧨", angle: 180, size: 0.9 }] } },

  // --- Ảnh bìa (cảnh vẽ bằng code; có file public/shop/<key>.webp thì đặt art: true) ---
  { key: "bia-trung-thu", kind: "bia", name: "Đêm trăng rằm", description: "Trăng tròn, đèn lồng, thỏ ngọc — mùa Trung thu.", price: 300, limitedUntil: "2026-10-15", collection: "trung-thu", gradient: "from-indigo-900 via-purple-800 to-orange-500", scene: SCENE["trung-thu"], art: true },
  { key: "bia-halloween", kind: "bia", name: "Đêm Halloween", description: "Trăng máu, bí ngô và dơi.", price: 300, limitedUntil: "2026-11-05", collection: "halloween", gradient: "from-black via-purple-900 to-orange-600", scene: SCENE["halloween"] },
  { key: "bia-giang-sinh", kind: "bia", name: "Giáng sinh", description: "Tuyết rơi, thông và quà.", price: 300, limitedUntil: "2026-12-31", collection: "giang-sinh", gradient: "from-emerald-700 via-red-600 to-emerald-800", scene: SCENE["giang-sinh"] },
  { key: "bia-tet", kind: "bia", name: "Tết", description: "Hoa mai, hoa đào, pháo hoa.", price: 300, limitedUntil: "2027-02-28", collection: "tet", gradient: "from-red-600 via-amber-400 to-pink-500", scene: SCENE["tet"] },
  { key: "bia-toeic-990", kind: "bia", name: "TOEIC 990", description: "Mục tiêu điểm tuyệt đối, treo lên cho nhớ.", price: 1200, gradient: "from-blue-900 via-blue-700 to-amber-400",
    scene: { sky: "linear-gradient(135deg,#0b1f4d 0%,#1d4ed8 60%,#f59e0b 100%)", stars: 20, props: [{ glyph: "🎯", x: 14, y: 30, size: 3.4 }, { glyph: "📈", x: 84, y: 26, size: 3, float: true }, { glyph: "🏆", x: 50, y: 62, size: 2.6 }] } },
  { key: "bia-ha-noi", kind: "bia", name: "Hà Nội", description: "Hồ Gươm chiều thu, lá vàng rơi.", price: 900, gradient: "from-amber-200 via-orange-300 to-rose-400",
    scene: { sky: "linear-gradient(180deg,#fde68a 0%,#fb923c 55%,#be123c 100%)", moon: { x: 70, y: 26, size: 18, color: "#fff7ed" }, hills: "#7c2d12", props: [{ glyph: "🍂", x: 12, y: 16, size: 2.4, float: true }, { glyph: "🍁", x: 30, y: 40, size: 2, float: true }, { glyph: "🛕", x: 86, y: 60, size: 3 }, { glyph: "🍂", x: 56, y: 24, size: 1.8, float: true }] } },
  { key: "bia-sai-gon", kind: "bia", name: "Sài Gòn", description: "Đêm thành phố không ngủ.", price: 900, gradient: "from-fuchsia-600 via-purple-700 to-blue-800",
    scene: { sky: "linear-gradient(180deg,#1e1b4b 0%,#6d28d9 55%,#c026d3 100%)", stars: 30, hills: "#0f0a2a", props: [{ glyph: "🏙️", x: 20, y: 52, size: 3.6 }, { glyph: "🏢", x: 66, y: 56, size: 3 }, { glyph: "🛵", x: 44, y: 76, size: 2 }, { glyph: "🌃", x: 90, y: 20, size: 2.4 }] } },
  { key: "bia-vu-tru", kind: "bia", name: "Vũ trụ", description: "Sao và tinh vân.", price: 1500, gradient: "from-slate-900 via-indigo-800 to-fuchsia-700",
    scene: { sky: "radial-gradient(ellipse at 30% 40%,#7e22ce 0%,#1e1b4b 40%,#020617 100%)", stars: 70, props: [{ glyph: "🪐", x: 74, y: 30, size: 4, float: true }, { glyph: "🚀", x: 22, y: 60, size: 2.6, float: true }, { glyph: "🌙", x: 50, y: 18, size: 1.8 }] } },
  { key: "bia-bien", kind: "bia", name: "Biển", description: "Xanh ngọc, cát trắng.", price: 600, gradient: "from-cyan-300 via-teal-400 to-blue-500",
    scene: { sky: "linear-gradient(180deg,#bae6fd 0%,#22d3ee 50%,#0369a1 100%)", moon: { x: 82, y: 22, size: 16, color: "#fef3c7" }, hills: "#fde68a", props: [{ glyph: "🌊", x: 10, y: 60, size: 3, float: true }, { glyph: "⛵", x: 60, y: 44, size: 2.4, float: true }, { glyph: "🐚", x: 84, y: 76, size: 1.8 }, { glyph: "🌴", x: 30, y: 58, size: 3 }] } },

  // --- Danh hiệu (hiện dưới tên ở bảng xếp hạng và trang cá nhân) ---
  { key: "dh-cu-dem", kind: "danh-hieu", name: "Cú đêm", description: "Học khuya mới vào.", price: 1000, gradient: "from-indigo-500 to-purple-600", decor: "🦉" },
  { key: "dh-mot-tu", kind: "danh-hieu", name: "Mọt từ", description: "Gặp từ nào cũng muốn nhớ.", price: 1000, gradient: "from-emerald-500 to-teal-600", decor: "📚" },
  { key: "dh-chien-binh", kind: "danh-hieu", name: "Chiến binh TOEIC", description: "Đang cày điểm.", price: 1500, gradient: "from-orange-500 to-red-600", decor: "⚔️" },
  { key: "dh-vit-vang", kind: "danh-hieu", name: "Vịt vàng", description: "Danh hiệu đắt nhất — khoe được.", price: 3000, gradient: "from-amber-400 to-yellow-600", decor: "🦆" },

  // --- Tiện ích ---
  { key: "dong-bang", kind: "dong-bang", name: "Đóng băng chuỗi", description: `Bỏ lỡ một ngày thì tự cứu chuỗi. Giữ tối đa ${FREEZE_MAX} cái.`, price: 300, gradient: "from-cyan-300 to-blue-500", decor: "❄️" },
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
