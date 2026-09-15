import type { Metadata } from "next";
import Link from "next/link";
import { CountUp } from "@/app/_components/count-up";
import { PageHeader } from "@/app/_components/page-header";
import { todayInAppZone } from "@/lib/leitner";
import {
  CHECKIN_KEY,
  getCheckinState,
  REWARD_RULES,
  STREAK_KEY_PREFIX,
  STREAK_MILESTONES,
} from "@/lib/rewards";
import { getStudyStats } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import { getDailyTasks } from "@/lib/tasks";

export const metadata: Metadata = { title: "Phần thưởng" };

/** Quy định thưởng của app + tình hình của chính mình. */
export default async function PhanThuongPage() {
  const supabase = await createClient();
  const today = todayInAppZone();
  const [stats, checkin, tasks, { data: completions }] = await Promise.all([
    getStudyStats(),
    getCheckinState(),
    getDailyTasks(),
    supabase.from("task_completions").select("task_key, xp, day"),
  ]);
  const rows = completions ?? [];
  const bonusTotal = rows.reduce((sum, row) => sum + row.xp, 0);
  const bonusToday = rows.filter((row) => row.day === today).reduce((sum, row) => sum + row.xp, 0);
  const checkinTotal = rows.filter((row) => row.task_key === CHECKIN_KEY).length;
  const reached = new Set(
    rows
      .filter((row) => row.task_key.startsWith(STREAK_KEY_PREFIX))
      .map((row) => Number(row.task_key.slice(STREAK_KEY_PREFIX.length))),
  );

  const summary = [
    { value: bonusToday, label: "XP thưởng hôm nay" },
    { value: bonusTotal, label: "XP thưởng tổng" },
    { value: checkinTotal, label: "lần điểm danh" },
    { value: stats.streak.current, label: "ngày học liên tiếp" },
  ];

  return (
    <>
      <PageHeader title="Phần thưởng" subtitle="Làm gì được XP, và bạn đang ở đâu" mascot="an-mung" />

      <div className="stagger grid gap-6 px-5 pt-2 pb-4 lg:grid-cols-2 lg:items-start">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            {summary.map((item) => (
              <div key={item.label} className="border-border bg-card rounded-2xl border p-4 text-center">
                <p className="text-2xl font-bold tabular-nums">
                  <CountUp value={item.value} />
                </p>
                <p className="text-muted mt-0.5 text-xs">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Hôm nay còn gì để nhận */}
          <section className="border-border bg-card rounded-2xl border p-4">
            <h2 className="font-semibold">Hôm nay còn nhận được</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span>📅 Điểm danh</span>
                {checkin.checkedToday ? (
                  <span className="font-semibold text-emerald-600">Đã nhận</span>
                ) : (
                  <span className="text-brand font-bold">+{checkin.nextXp} XP</span>
                )}
              </li>
              {tasks.tasks.map((task) => (
                <li key={task.key} className="flex items-center justify-between gap-3">
                  <Link href={task.href} className="min-w-0 truncate hover:underline">
                    {task.emoji} {task.title}
                  </Link>
                  {task.done ? (
                    <span className="font-semibold text-emerald-600">Đã nhận</span>
                  ) : (
                    <span className="text-brand shrink-0 font-bold">+{task.xp} XP</span>
                  )}
                </li>
              ))}
              <li className="flex items-center justify-between gap-3">
                <span>🎁 Xong cả ba nhiệm vụ</span>
                {tasks.allDone ? (
                  <span className="font-semibold text-emerald-600">Đã nhận</span>
                ) : (
                  <span className="text-brand font-bold">+30 XP</span>
                )}
              </li>
            </ul>
          </section>

          {/* Mốc chuỗi */}
          <section className="border-border bg-card rounded-2xl border p-4">
            <h2 className="font-semibold">Mốc chuỗi ngày học</h2>
            <p className="text-muted mt-0.5 text-sm">
              Đang {stats.streak.current} ngày · kỷ lục {stats.streak.longest} ngày
            </p>
            <ol className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3">
              {STREAK_MILESTONES.map(([days, xp]) => {
                const done = reached.has(days);
                return (
                  <li
                    key={days}
                    className={`rounded-xl border p-2 text-center ${
                      done
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-border bg-brand-soft/40"
                    }`}
                  >
                    <p className="text-lg font-bold tabular-nums">{days}</p>
                    <p className="text-muted text-[11px]">ngày</p>
                    <p className={`mt-1 text-xs font-bold ${done ? "text-emerald-600" : "text-brand"}`}>
                      {done ? "✓ " : "+"}
                      {xp} XP
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        {/* Quy định */}
        <section className="space-y-3">
          <h2 className="text-muted px-1 text-sm font-medium">Quy định thưởng</h2>
          {REWARD_RULES.map((rule) => (
            <div key={rule.title} className="border-border bg-card rounded-2xl border p-4">
              <p className="flex items-center gap-2 font-semibold">
                <span className="bg-brand-soft flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg">
                  {rule.emoji}
                </span>
                {rule.title}
              </p>
              <ul className="text-muted mt-2 list-disc space-y-1 pl-5 text-sm">
                {rule.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              {"note" in rule ? <p className="text-muted mt-2 text-xs">{rule.note}</p> : null}
            </div>
          ))}
          <p className="text-muted px-1 text-xs">
            XP quyết định cấp độ và thứ hạng trên bảng xếp hạng. Không mua bán, không quảng cáo.
          </p>
        </section>
      </div>
    </>
  );
}
