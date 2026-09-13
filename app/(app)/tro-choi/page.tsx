import type { Metadata } from "next";
import { Mascot } from "@/app/_components/mascot";
import { PageHeader } from "@/app/_components/page-header";
import { GameCard } from "./game-card";
import { GAMES } from "./games";

export const metadata: Metadata = { title: "Luyện tập" };

function Section({
  id,
  title,
  description,
  items,
}: {
  id: string;
  title: string;
  description: string;
  items: typeof GAMES;
}) {
  return (
    <section aria-labelledby={id} className="pb-6">
      <div className="px-6 pb-3">
        <div className="flex items-center gap-2">
          <h2 id={id} className="font-semibold">
            {title}
          </h2>
          <span className="bg-brand-soft text-brand rounded-full px-2 py-0.5 text-xs font-bold tabular-nums">
            {items.length}
          </span>
        </div>
        <p className="text-muted mt-0.5 text-sm">{description}</p>
      </div>
      <div className="stagger grid gap-4 px-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((game) => (
          <GameCard key={game.slug} game={game} />
        ))}
      </div>
    </section>
  );
}

/** Hai nhóm: trò chơi ôn từ cho vui, và luyện kỹ năng / thi thử nghiêm túc hơn. */
export default function LuyenTapPage() {
  const games = GAMES.filter((game) => game.kind === "game");
  const skills = GAMES.filter((game) => game.kind === "skill");

  return (
    <>
      <PageHeader
        title="Luyện tập"
        subtitle="Chơi 5 phút, nhớ từ cả tuần"
        mascot="choi"
      />

      <div className="px-5 pt-2 pb-5">
        <div className="border-border bg-card flex items-center gap-4 rounded-2xl border p-4">
          <Mascot variant="choi" size={96} className="shrink-0 rounded-2xl" />
          <p className="text-muted text-sm leading-relaxed">
            Mọi hoạt động ở đây đều ghi vào cùng hệ ôn tập và tính XP như khi
            học từ. Trò chơi để nhớ từ cho vui; luyện kỹ năng để nghe, nói và
            thi thử nghiêm túc hơn.
          </p>
        </div>
      </div>

      <Section
        id="tro-choi"
        title="Trò chơi"
        description="Ôn từ vựng theo kiểu chơi, có kỷ lục và combo"
        items={games}
      />
      <Section
        id="ky-nang"
        title="Luyện kỹ năng"
        description="Nghe, nói và thi thử — sát với kỳ thi hơn"
        items={skills}
      />
    </>
  );
}
