import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/app/_components/avatar";
import { BadgeChip } from "@/app/_components/badge-chip";
import { TitleChip } from "@/app/_components/title-chip";
import { topBadges } from "@/lib/badges";
import { EmptyState } from "@/app/_components/empty-state";
import { PageHeader } from "@/app/_components/page-header";
import { getLeaderboard, type LeaderboardPeriod } from "@/lib/leaderboard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Bảng xếp hạng" };

const TOP_N = 20;
const MEDALS = ["🥇", "🥈", "🥉"];

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: "week", label: "7 ngày" },
  { key: "all", label: "Tất cả" },
];

export default async function XepHangPage({
  searchParams,
}: PageProps<"/xep-hang">) {
  const params = await searchParams;
  const period: LeaderboardPeriod = params.ky === "all" ? "all" : "week";
  const supabase = await createClient();
  const [rows, { data: profile }] = await Promise.all([
    getLeaderboard(period, TOP_N),
    supabase.from("profiles").select("hide_rank").maybeSingle(),
  ]);
  const hidden = profile?.hide_rank ?? false;

  const top = rows.filter((row) => row.rank <= TOP_N);
  const me = rows.find((row) => row.isMe);
  const meOutsideTop = me && me.rank > TOP_N ? me : null;

  return (
    <>
      <PageHeader
        title="Bảng xếp hạng"
        subtitle="XP tính từ mọi lượt học và chơi"
        mascot="an-mung"
      />

      <div className="px-5 pt-2 pb-4">
        <div role="tablist" aria-label="Khoảng thời gian" className="pill-tabs mb-5 w-full">
          {PERIODS.map((option) => {
            const active = option.key === period;
            return (
              <Link
                key={option.key}
                role="tab"
                aria-selected={active}
                href={option.key === "week" ? "/xep-hang" : "/xep-hang?ky=all"}
                className="pill-tab flex-1"
              >
                {option.label}
              </Link>
            );
          })}
        </div>

        {top.length === 0 ? (
          <EmptyState
            mascot="ngu"
            title="Chưa ai ghi điểm"
            description="Học vài từ là bạn đứng đầu bảng ngay."
          />
        ) : (
          <ol className="stagger space-y-2">
            {top.map((row) => (
              <li
                key={`${row.rank}-${row.displayName}`}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                  row.isMe
                    ? "border-brand bg-brand-soft"
                    : "border-border bg-card"
                }`}
              >
                <span className="w-9 shrink-0 text-center text-lg font-bold tabular-nums">
                  {MEDALS[row.rank - 1] ?? row.rank}
                </span>
                <Avatar url={row.avatarUrl} name={row.displayName} size={36} frame={row.frame} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {row.userId && !row.isMe ? (
                      <Link href={`/nguoi-dung/${row.userId}`} className="hover:text-brand hover:underline">
                        {row.displayName}
                      </Link>
                    ) : (
                      row.displayName
                    )}
                    {row.isMe ? (
                      <span className="text-brand ml-2 text-xs font-bold">Bạn</span>
                    ) : null}
                  </span>
                  <TitleChip title={row.title} className="mt-0.5" />
                  {row.badges.length > 0 ? (
                    <span className="mt-1 flex items-center gap-1">
                      {topBadges(row.badges).map((badge) => (
                        <BadgeChip key={badge.key} badge={badge} size={22} />
                      ))}
                      {row.badges.length > 3 ? (
                        <span className="text-muted text-[11px] font-semibold">+{row.badges.length - 3}</span>
                      ) : null}
                    </span>
                  ) : null}
                </span>
                <span className="text-brand shrink-0 font-bold tabular-nums">
                  {row.xp.toLocaleString("vi-VN")} XP
                </span>
              </li>
            ))}
          </ol>
        )}

        {meOutsideTop ? (
          <div className="border-brand bg-brand-soft mt-4 flex items-center gap-3 rounded-2xl border px-4 py-3">
            <span className="w-9 shrink-0 text-center text-lg font-bold tabular-nums">
              {meOutsideTop.rank}
            </span>
            <span className="min-w-0 flex-1 truncate font-semibold">
              {meOutsideTop.displayName}
              <span className="text-brand ml-2 text-xs font-bold">Bạn</span>
            </span>
            <span className="text-brand shrink-0 font-bold tabular-nums">
              {meOutsideTop.xp.toLocaleString("vi-VN")} XP
            </span>
          </div>
        ) : null}

        {hidden ? (
          <p className="bg-brand-soft mt-4 rounded-2xl px-4 py-3 text-center text-sm">
            Bạn đang ẩn khỏi bảng xếp hạng.{" "}
            <Link href="/tai-khoan" className="text-brand font-semibold">
              Bật lại ở Cá nhân
            </Link>
          </p>
        ) : null}

        <p className="text-muted mt-6 text-center text-xs">
          Tên hiển thị lấy từ tab Cá nhân. Nhớ +10 XP, quên +3 XP. Muốn ẩn tên,
          bật “Ẩn tôi khỏi bảng xếp hạng” ở Cá nhân.
        </p>
      </div>
    </>
  );
}
