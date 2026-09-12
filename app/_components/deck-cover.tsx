import Image, { type StaticImageData } from "next/image";
import coverCongViec from "@/public/decks/cong-viec-van-phong.png";
import coverGiaoTiep from "@/public/decks/giao-tiep-hang-ngay.png";
import coverToeic from "@/public/decks/toeic-co-ban.png";
import { CardsIcon } from "./icons";

/** Ảnh bìa vẽ riêng cho bộ có sẵn, tìm theo slug trong bảng decks. */
const COVERS: Record<string, StaticImageData> = {
  "giao-tiep-hang-ngay": coverGiaoTiep,
  "cong-viec-van-phong": coverCongViec,
  "toeic-co-ban": coverToeic,
};

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
  deck: { id: string; name: string; slug?: string | null };
  /** Gợi ý cho next/image biết ảnh chiếm bao nhiêu bề ngang. */
  sizes?: string;
  className?: string;
};

/**
 * Bìa bộ từ. Bộ có sẵn: ảnh vẽ riêng (đã có tên bộ trong tranh). Bộ tự tạo:
 * gradient theo id + chữ cái đầu tên bộ + icon thẻ mờ.
 */
export function DeckCover({ deck, sizes = "100vw", className = "" }: Props) {
  const cover = deck.slug ? COVERS[deck.slug] : undefined;

  if (cover) {
    return (
      <div
        aria-hidden
        className={`relative overflow-hidden bg-slate-800 ${className}`}
      >
        <Image
          src={cover}
          alt=""
          fill
          sizes={sizes}
          className="object-cover object-[50%_70%] transition-transform duration-500 group-hover:scale-[1.04]"
        />
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
