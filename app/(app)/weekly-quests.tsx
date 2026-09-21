import type { WeeklyQuests } from "@/lib/weekly";

/** Khối "Nhiệm vụ tuần" ở trang chủ: 2 việc, thanh tiến độ, XP + Hạt. */
export function WeeklyQuestList({ data }: { data: WeeklyQuests }) {
  const doneCount = data.quests.filter((q) => q.done).length;
  return (
    <section aria-labelledby="nhiem-vu-tuan" className="space-y-3">
      <div className="flex items-baseline justify-between px-1">
        <h2 id="nhiem-vu-tuan" className="text-muted text-sm font-medium">
          Nhiệm vụ tuần
        </h2>
        <span className="text-muted text-sm tabular-nums">
          {doneCount}/{data.quests.length} · còn {data.daysLeft} ngày
        </span>
      </div>

      <div className="border-border bg-card divide-border divide-y overflow-hidden rounded-2xl border">
        {data.quests.map((quest) => {
          const percent = Math.round((quest.current / quest.target) * 100);
          return (
            <div
              key={quest.key}
              className={`flex items-center gap-3 p-3 pr-4 ${
                quest.done ? "bg-emerald-50/60 dark:bg-emerald-500/10" : ""
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                  quest.done ? "bg-emerald-500 text-white" : "bg-brand-soft"
                }`}
              >
                {quest.done ? (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span aria-hidden>{quest.emoji}</span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={`truncate font-semibold ${quest.done ? "text-muted line-through" : ""}`}>
                    {quest.title}
                  </span>
                  <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                    +{quest.xp} XP
                  </span>
                  <span className="shrink-0 rounded-full bg-orange-500/15 px-2 py-0.5 text-[11px] font-bold text-orange-600">
                    +{quest.seeds} 🌾
                  </span>
                </span>
                {quest.done ? (
                  <span className="text-muted mt-0.5 block text-xs">Đã xong tuần này</span>
                ) : (
                  <span className="mt-1.5 flex items-center gap-2">
                    <span className="bg-brand-soft h-1.5 flex-1 overflow-hidden rounded-full">
                      <span
                        className="bg-brand block h-full rounded-full transition-[width] duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                    <span className="text-muted shrink-0 text-xs tabular-nums">
                      {quest.current}/{quest.target}
                    </span>
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
