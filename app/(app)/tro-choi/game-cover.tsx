import Image from "next/image";
import type { GameEntry } from "./games";

/**
 * Trò nào đã có ảnh bìa vẽ riêng ở public/games/<slug>.png (đã có tiêu đề
 * trong tranh). Trò chưa có ảnh hiện gradient màu game.
 */
const COVERED = new Set(["mua-tu", "ghep-cap", "nghe-go", "quiz", "phat-am"]);

type Props = {
  game: GameEntry;
  /** Gợi ý cho next/image biết ảnh chiếm bao nhiêu bề ngang ở từng cỡ màn. */
  sizes: string;
  className?: string;
};

/**
 * Bìa game: ảnh vẽ riêng trên nền gradient màu game (lộ ra ở góc bo của
 * tranh). Dùng chung cho thẻ ở hub và thẻ nhỏ ở trang chủ.
 */
export function GameCover({ game, sizes, className = "" }: Props) {
  const cover = COVERED.has(game.slug) ? `/games/${game.slug}.png` : null;
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${game.gradient} ${className}`}
    >
      {cover ? (
        <Image
          src={cover}
          alt=""
          fill
          sizes={sizes}
          className="object-cover object-[50%_70%] transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <span className="absolute inset-0 flex items-end p-4 text-2xl font-bold text-white drop-shadow">
          {game.title}
        </span>
      )}
    </div>
  );
}
