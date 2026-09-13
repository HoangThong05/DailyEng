import Image from "next/image";
import type { DeckCategory } from "@/lib/database.types";
import { categoryOf } from "@/lib/deck-categories";
import {
  categoryCoverUrl,
  COVERS_WITH_TITLE,
  deckCoverUrl,
} from "@/lib/deck-covers";
import { CardsIcon } from "./icons";

/**
 * Bảng màu cho bìa bộ từ tự tạo. Chọn theo id nên cùng một bộ luôn cùng
 * màu, các bộ khác nhau thì tản ra.
 */
const PALETTE = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-orange-400 to-rose-500",
  "from-fuchsia-500 to-purple-600",
  "from-sky-400 to-cyan-600",
  "from-amber-400 to-orange-500",
  "from-lime-500 to-green-600",
  "from-pink-500 to-rose-600",
];

export function deckGradient(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

type Props = {
  deck: {
    id: string;
    name: string;
    slug?: string | null;
    category?: DeckCategory | null;
  };
  /** Gợi ý cho next/image biết ảnh chiếm bao nhiêu bề ngang. */
  sizes?: string;
  className?: string;
};

/** Tên bộ bỏ tiền tố nhóm ("TOEIC · Văn phòng" → "Văn phòng"). */
function shortName(name: string) {
  return name.includes("·") ? name.slice(name.indexOf("·") + 1).trim() : name;
}

/**
 * Bìa bộ từ, theo thứ tự ưu tiên:
 *  1. ảnh vẽ riêng theo slug (đã có tên bộ trong tranh);
 *  2. ảnh nền của nhóm + tên bộ đè lên;
 *  3. bộ thuộc nhóm có sẵn: gradient của nhóm + tên bộ;
 *  4. bộ tự tạo: gradient theo id + chữ cái đầu.
 */
export function DeckCover({ deck, sizes = "100vw", className = "" }: Props) {
  const own = deckCoverUrl(deck.slug);
  if (own && deck.slug && COVERS_WITH_TITLE.has(deck.slug)) {
    return (
      <div
        aria-hidden
        className={`relative overflow-hidden bg-slate-800 ${className}`}
      >
        <Image
          src={own}
          alt=""
          fill
          sizes={sizes}
          className="object-cover object-[50%_70%] transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>
    );
  }

  const category = categoryOf(deck.category);
  const photo = own ?? categoryCoverUrl(deck.category);
  if (photo) {
    return (
      <div
        aria-hidden
        className={`relative flex flex-col items-start justify-end overflow-hidden bg-slate-800 p-4 text-white ${className}`}
      >
        <Image
          src={photo}
          alt=""
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {/* Phủ tối phía dưới để chữ đọc được trên mọi ảnh */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {category ? (
          <span className="relative text-[11px] font-bold tracking-wide uppercase opacity-90">
            {category.label}
          </span>
        ) : null}
        <span className="relative line-clamp-2 text-xl leading-tight font-bold drop-shadow">
          {shortName(deck.name)}
        </span>
      </div>
    );
  }

  if (category) {
    return (
      <div
        aria-hidden
        className={`relative flex flex-col items-start justify-end overflow-hidden bg-gradient-to-br p-4 text-white ${category.gradient} ${className}`}
      >
        <CardsIcon className="absolute -top-4 -right-4 h-28 w-28 text-white/15 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110" />
        <span className="text-[11px] font-bold tracking-wide uppercase opacity-80">
          {category.label}
        </span>
        <span className="line-clamp-2 text-xl leading-tight font-bold drop-shadow">
          {shortName(deck.name)}
        </span>
      </div>
    );
  }

  const initial = deck.name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      aria-hidden
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br text-white ${deckGradient(deck.id)} ${className}`}
    >
      <CardsIcon className="absolute -right-3 -bottom-3 h-20 w-20 text-white/15 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110" />
      <span className="text-3xl font-bold drop-shadow">{initial}</span>
    </div>
  );
}
