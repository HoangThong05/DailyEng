import Link from "next/link";
import { ChevronRightIcon } from "@/app/_components/icons";
import { ALL_DONE_XP, type DailyTasks } from "@/lib/tasks";

/** Khối "Nhiệm vụ hôm nay" ở trang chủ: 3 việc, thanh tiến độ, XP thưởng. */
export function DailyTaskList({ data }: { data: DailyTasks }) {
  const doneCount = data.tasks.filter((t) => t.done).length;

  return (
    <section aria-labelledby="nhiem-vu" className="space-y-3">
      <div className="flex items-baseline justify-between px-1">
        <h2 id="nhiem-vu" className="text-muted text-sm font-medium">
          Nhiệm vụ hôm nay
        </h2>
        <span className="text-muted text-sm tabular-nums">
          {doneCount}/{data.tasks.length}
          {data.earnedXp > 0 ? (
            <span className="text-brand ml-2 font-semibold">+{data.earnedXp} XP</span>
          ) : null}
        </span>
      </div>

      <div className="border-border bg-card divide-border divide-y overflow-hidden rounded-2xl border">
        {data.tasks.map((task) => {
          const percent = Math.round((task.current / task.target) * 100);
          return (
            <Link
              key={task.key}
              href={task.href}
              aria-label={`${task.title}, ${task.current}/${task.target}${task.done ? ", đã xong" : ""}`}
              className={`group flex items-center gap-3 p-3 pr-4 transition-colors ${
                task.done ? "bg-emerald-50/60 dark:bg-emerald-500/10" : "hover:bg-brand-soft/50"
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                  task.done ? "bg-emerald-500 text-white" : "bg-brand-soft"
                }`}
              >
                {task.done ? (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span aria-hidden>{task.emoji}</span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className={`truncate font-semibold ${task.done ? "text-muted line-through" : ""}`}>
                    {task.title}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      task.done ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"
                    }`}
                  >
                    +{task.xp} XP
                  </span>
                </span>
                {task.done ? (
                  <span className="text-muted mt-0.5 block text-xs">Đã xong</span>
                ) : (
                  <span className="mt-1.5 flex items-center gap-2">
                    <span className="bg-brand-soft h-1.5 flex-1 overflow-hidden rounded-full">
                      <span
                        className="bg-brand block h-full rounded-full transition-[width] duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                    <span className="text-muted shrink-0 text-xs tabular-nums">
                      {task.current}/{task.target}
                    </span>
                  </span>
                )}
              </span>
              {task.done ? null : (
                <ChevronRightIcon className="text-muted h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
              )}
            </Link>
          );
        })}

        <p
          className={`px-4 py-2.5 text-center text-xs font-semibold ${
            data.allDone
              ? "bg-emerald-500 text-white"
              : "bg-brand-soft/60 text-muted"
          }`}
        >
          {data.allDone
            ? `Xong cả ba! Thưởng thêm +${ALL_DONE_XP} XP 🎉`
            : `Xong cả ba nhiệm vụ: thưởng thêm +${ALL_DONE_XP} XP`}
        </p>
      </div>
    </section>
  );
}
