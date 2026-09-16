import type { Metadata } from "next";
import { Mascot } from "@/app/_components/mascot";
import { PageHeader } from "@/app/_components/page-header";
import { GameCard } from "./game-card";
import { GAMES } from "./games";

export const metadata: Metadata = { title: "Trò chơi" };

/** Chỉ trò chơi ôn từ; luyện nghe/nói/thi thử nằm ở tab Kỹ năng. */
export default function TroChoiPage() {
  const games = GAMES.filter((game) => game.kind === "game");

  return (
    <>
      <PageHeader
        title="Trò chơi"
        subtitle="Chơi 5 phút, nhớ từ cả tuần"
        mascot="choi"
      />

      <div className="px-5 pt-2 pb-4">
        <div className="border-border bg-card flex items-center gap-4 rounded-2xl border p-4">
          <Mascot variant="choi" size={96} className="shrink-0" />
          <p className="text-muted text-sm leading-relaxed">
            Mỗi trò là một cách ôn khác nhau. Chơi xong, từ nào nhớ hay quên
            đều được ghi lại và tính XP như khi học.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-6 pb-3">
        <h2 className="font-semibold">Game từ vựng</h2>
        <span className="bg-brand-soft text-brand rounded-full px-2 py-0.5 text-xs font-bold tabular-nums">
          {games.length}
        </span>
      </div>

      <div className="stagger grid gap-4 px-5 pb-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {games.map((game) => (
          <GameCard key={game.slug} game={game} />
        ))}
      </div>
    </>
  );
}
