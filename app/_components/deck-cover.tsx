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
  deck: { id: string; name: string };
  className?: string;
};

/**
 * Bìa bộ từ: gradient theo id + chữ cái đầu tên bộ + icon thẻ mờ.
 * Bộ có sẵn sẽ có ảnh vẽ riêng sau; component này là mặc định cho mọi bộ.
 */
export function DeckCover({ deck, className = "" }: Props) {
  const initial = deck.name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      aria-hidden
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br text-white ${deckGradient(deck.id)} ${className}`}
    >
      <CardsIcon className="absolute -right-3 -bottom-3 h-20 w-20 text-white/15" />
      <span className="text-3xl font-bold drop-shadow">{initial}</span>
    </div>
  );
}
