/** Ảnh bìa có sẵn cho hồ sơ. Khoá lưu trong profiles.cover. */
export const COVER_PRESETS = {
  sky: { label: "Trời xanh", className: "from-blue-500 to-indigo-700" },
  sunset: { label: "Hoàng hôn", className: "from-orange-400 via-rose-500 to-pink-600" },
  forest: { label: "Rừng", className: "from-emerald-400 via-teal-500 to-cyan-700" },
  grape: { label: "Nho", className: "from-violet-500 via-purple-600 to-fuchsia-600" },
  night: { label: "Đêm", className: "from-slate-700 via-indigo-900 to-black" },
  candy: { label: "Kẹo", className: "from-pink-400 via-amber-300 to-yellow-400" },
} as const;

export type CoverKey = keyof typeof COVER_PRESETS;

export const DEFAULT_COVER: CoverKey = "sky";
export const BIO_MAX = 160;

/** Ảnh bìa tự tải lên lưu dạng "url:<link>"; còn lại là khoá preset. */
export function parseCover(cover: string | null | undefined): {
  url: string | null;
  preset: CoverKey;
} {
  if (cover?.startsWith("url:")) return { url: cover.slice(4), preset: DEFAULT_COVER };
  return {
    url: null,
    preset: cover && cover in COVER_PRESETS ? (cover as CoverKey) : DEFAULT_COVER,
  };
}
