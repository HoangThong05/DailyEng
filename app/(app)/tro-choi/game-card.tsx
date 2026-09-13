import Link from "next/link";
import {
  ClockIcon,
  CloudRainIcon,
  GamepadIcon,
  ImageIcon,
  MicIcon,
  PencilIcon,
  QuizIcon,
  SpeakerIcon,
} from "@/app/_components/icons";
import { GameCover } from "./game-cover";
import type { GameEntry } from "./games";

const ICONS = {
  rain: CloudRainIcon,
  gamepad: GamepadIcon,
  speaker: SpeakerIcon,
  quiz: QuizIcon,
  mic: MicIcon,
  pencil: PencilIcon,
  clock: ClockIcon,
  image: ImageIcon,
} as const;

/**
 * Thẻ trò chơi kiểu "ảnh bìa + mô tả + nút Chơi ngay". Cả thẻ là một link;
 * nút chỉ để nhìn cho rõ chỗ bấm.
 */
export function GameCard({ game }: { game: GameEntry }) {
  const Icon = ICONS[game.icon];

  return (
    <Link
      href={game.href}
      className="border-border bg-card group flex flex-col overflow-hidden rounded-2xl border press"
    >
      {/* Bìa: ảnh vẽ riêng; gradient màu game lót phía sau cho góc bo của tranh */}
      <div className="relative">
        <GameCover
          game={game}
          sizes="(min-width: 1024px) 300px, (min-width: 768px) 50vw, 100vw"
          className="aspect-[4/3]"
        />
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
          {game.kind === "skill" ? "Luyện ngay" : "Chơi ngay"}
          <span aria-hidden className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
