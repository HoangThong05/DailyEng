import Image, { type StaticImageData } from "next/image";
import coverGhepCap from "@/public/games/ghep-cap.png";
import coverMuaTu from "@/public/games/mua-tu.png";
import coverNgheGo from "@/public/games/nghe-go.png";
import coverPhatAm from "@/public/games/phat-am.png";
import coverQuiz from "@/public/games/quiz.png";
import type { GameEntry } from "./games";

/** Ảnh bìa vẽ riêng cho từng trò, đã có tiêu đề trong tranh. */
const COVERS: Record<string, StaticImageData> = {
  "mua-tu": coverMuaTu,
  "ghep-cap": coverGhepCap,
  "nghe-go": coverNgheGo,
  quiz: coverQuiz,
  "phat-am": coverPhatAm,
};

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
  const cover = COVERS[game.slug];
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
      ) : null}
    </div>
  );
}
