import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import {
  CloudRainIcon,
  GamepadIcon,
  MicIcon,
  QuizIcon,
  SpeakerIcon,
} from "@/app/_components/icons";
import coverGhepCap from "@/public/games/ghep-cap.png";
import coverMuaTu from "@/public/games/mua-tu.png";
import coverNgheGo from "@/public/games/nghe-go.png";
import coverPhatAm from "@/public/games/phat-am.png";
import coverQuiz from "@/public/games/quiz.png";
import type { GameEntry } from "./games";

const ICONS = {
  rain: CloudRainIcon,
  gamepad: GamepadIcon,
  speaker: SpeakerIcon,
  quiz: QuizIcon,
  mic: MicIcon,
} as const;

/** Ảnh bìa vẽ riêng cho từng trò, đã có tiêu đề trong tranh. */
const COVERS: Record<string, StaticImageData> = {
  "mua-tu": coverMuaTu,
  "ghep-cap": coverGhepCap,
  "nghe-go": coverNgheGo,
  quiz: coverQuiz,
  "phat-am": coverPhatAm,
};

/**
 * Thẻ trò chơi kiểu "ảnh bìa + mô tả + nút Chơi ngay". Cả thẻ là một link;
 * nút chỉ để nhìn cho rõ chỗ bấm.
 */
export function GameCard({ game }: { game: GameEntry }) {
  const Icon = ICONS[game.icon];
  const cover = COVERS[game.slug];

  return (
    <Link
      href={game.href}
      className="border-border bg-card group flex flex-col overflow-hidden rounded-2xl border press"
    >
      {/* Bìa: ảnh vẽ riêng; gradient màu game lót phía sau cho góc bo của tranh */}
      <div
        className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${game.gradient}`}
      >
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(min-width: 1024px) 300px, (min-width: 768px) 50vw, 100vw"
            className="object-cover object-[50%_70%] transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <Icon className="absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 text-white/80" />
        )}

        <span className="absolute top-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase backdrop-blur-sm">
          {game.badge}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <span className="bg-brand-soft text-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
            <Icon className="h-4.5 w-4.5" />
          </span>
          {game.title}
        </h3>
        <p className="text-muted line-clamp-2 text-sm leading-relaxed">
          {game.description}
        </p>
        <span
          className={`mt-auto flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-colors ${game.button}`}
        >
          Chơi ngay
          <span aria-hidden className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
