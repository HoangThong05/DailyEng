import type { Metadata } from "next";
import { Mascot } from "@/app/_components/mascot";
import { PageHeader } from "@/app/_components/page-header";
import { GameCard } from "../tro-choi/game-card";
import { GAMES } from "../tro-choi/games";

export const metadata: Metadata = { title: "Luyện kỹ năng" };

/** Nghe, nói, thi thử — nghiêm túc hơn trò chơi, sát kỳ thi hơn. */
export default function KyNangPage() {
  const skills = GAMES.filter((game) => game.kind === "skill");

  return (
    <>
      <PageHeader
        title="Luyện kỹ năng"
        subtitle="Nghe, nói và thi thử"
        mascot="noi"
      />

      <div className="px-5 pt-2 pb-4">
        <div className="border-border bg-card flex items-center gap-4 rounded-2xl border p-4">
          <Mascot variant="noi" size={96} className="shrink-0" />
          <p className="text-muted text-sm leading-relaxed">
            Luyện nghe cả câu, nói theo giọng mẫu và làm đề thử như thi thật.
            Kết quả vẫn ghi vào hệ ôn tập và tính XP.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-6 pb-3">
        <h2 className="font-semibold">Bài luyện</h2>
        <span className="bg-brand-soft text-brand rounded-full px-2 py-0.5 text-xs font-bold tabular-nums">
          {skills.length}
        </span>
      </div>

      <div className="stagger grid gap-4 px-5 pb-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {skills.map((game) => (
          <GameCard key={game.slug} game={game} />
        ))}
      </div>
    </>
  );
}
