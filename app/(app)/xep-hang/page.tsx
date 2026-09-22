import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/app/_components/avatar";
import { BadgeChip } from "@/app/_components/badge-chip";
import { EmptyState } from "@/app/_components/empty-state";
import { PageHeader } from "@/app/_components/page-header";
import { TitleChip } from "@/app/_components/title-chip";
import { topBadges } from "@/lib/badges";
import { getFriendLeaderboard } from "@/lib/friends";
import { getLeaderboard } from "@/lib/leaderboard";
import { addDays } from "@/lib/leitner";
import {
  getMyAwards,
  getWeekBoard,
  seasonEndsAt,
  seasonPrize,
  type SeasonRow,
  weekLabel,
  weekStart,
} from "@/lib/season";
import { createClient } from "@/lib/supabase/server";
import { SeasonCard } from "./season-card";

export const metadata: Metadata = { title: "Bảng xếp hạng" };

const TOP_N = 20;
const MEDALS = ["🥇", "🥈", "🥉"];

/** Ba bảng: mùa tuần (có thưởng), nhóm bạn bè, và tổng mọi thời gian. */
type Board = "mua" | "ban-be" | "tat-ca";

const BOARDS: { key: Board; label: string }[] = [
  { key: "mua", label: "Mùa tuần" },
  { key: "ban-be", label: "Bạn bè" },
  { key: "tat-ca", label: "Tất cả" },
];

function boardHref(board: Board, past = false) {
  if (board === "mua") return past ? "/xep-hang?tuan=truoc" : "/xep-hang";
  return `/xep-hang?bang=${board}`;
}

export default async function XepHangPage({ searchParams }: PageProps<"/xep-hang">) {
  const params = await searchParams;
  // ?nhom=ban-be là đường dẫn cũ, vẫn nhận để link đã chia sẻ không hỏng.
  const board: Board =
    params.bang === "tat-ca"
      ? "tat-ca"
      : params.bang === "ban-be" || params.nhom === "ban-be"
        ? "ban-be"
        : "mua";
  const past = params.tuan === "truoc";
  const monday = past ? addDays(weekStart(), -7) : weekStart();

  const supabase = await createClient();
  const [rows, { data: profile }, awards] = await Promise.all([
    board === "mua"
      ? getWeekBoard(monday, TOP_N)
      : board === "ban-be"
        ? getFriendLeaderboard("week")
        : getLeaderboard("all", TOP_N),
    supabase.from("profiles").select("hide_rank").maybeSingle(),
    board === "mua" ? getMyAwards(4) : Promise.resolve([]),
  ]);
  const hidden = profile?.hide_rank ?? false;

  const list = rows as SeasonRow[];
  const top = list.filter((row) => row.rank <= TOP_N);
  const me = list.find((row) => row.isMe);
  const meOutsideTop = me && me.rank > TOP_N ? me : null;

  const subtitle =
    board === "mua"
      ? past
        ? `Kết quả tuần ${weekLabel(monday)}`
        : "Top tuần này nhận Hạt và danh hiệu"
      : board === "ban-be"
        ? "Chỉ bạn bè của bạn · 7 ngày"
        : "Tổng XP từ trước tới nay";

  return (
    <>
      <PageHeader title="Bảng xếp hạng" subtitle={subtitle} mascot="an-mung" />

      <div className="space-y-5 px-5 pt-2 pb-4">
        <div role="tablist" aria-label="Chọn bảng" className="pill-tabs w-full">
          {BOARDS.map((option) => (
            <Link
              key={option.key}
              role="tab"
              aria-selected={board === option.key}
              href={boardHref(option.key)}
              className="pill-tab flex-1"
            >
              {option.label}
            </Link>
          ))}
        </div>

        {board === "mua" ? (
          <>
            {past ? (
              <div className="border-border bg-card flex items-center justify-between gap-3 rounded-2xl border px-4 py-3">
                <span className="text-sm font-semibold">Tuần {weekLabel(monday)} · đã đóng</span>
                <Link href={boardHref("mua")} className="text-brand text-sm font-semibold">
                  Về tuần này →
                </Link>
              </div>
            ) : (
              <>
                <SeasonCard endsAt={seasonEndsAt(monday)} label={weekLabel(monday)} />
                <div className="flex justify-center">
                  <Link href={boardHref("mua", true)} className="text-muted text-sm font-medium">
                    ← Xem kết quả tuần trước
                  </Link>
                </div>
              </>
            )}

            {awards.length > 0 ? (
              <section className="border-border bg-card rounded-2xl border p-4">
                <h2 className="font-semibold">Thành tích của bạn</h2>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {awards.map((award) => (
                    <li key={award.weekStart} className="flex items-center justify-between gap-3">
                      <span className="text-muted">
                        Tuần {weekLabel(award.weekStart)} · hạng{" "}
                        <strong className="text-fg">{award.rank}</strong>
                      </span>
                      <span className="shrink-0 font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                        +{award.seeds} 🌾
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        ) : null}

        {top.length === 0 ? (
          <EmptyState
            mascot="ngu"
            title={
              board === "ban-be"
                ? "Chưa có bạn nào"
                : past
                  ? "Tuần đó chưa ai ghi điểm"
                  : "Chưa ai ghi điểm tuần này"
            }
            description={
              board === "ban-be"
                ? "Kết bạn ở tab Bạn bè rồi quay lại đua XP cùng nhau."
                : "Học vài từ là bạn đứng đầu bảng ngay."
            }
          />
        ) : (
          <ol className="stagger space-y-2">
            {top.map((row) => {
              const prize = board === "mua" && !past ? seasonPrize(row.rank) : 0;
              return (
                <li
                  key={`${row.rank}-${row.displayName}`}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                    row.isMe ? "border-brand bg-brand-soft" : "border-border bg-card"
                  }`}
                >
                  <span className="w-9 shrink-0 text-center text-lg font-bold tabular-nums">
                    {MEDALS[row.rank - 1] ?? row.rank}
                  </span>
                  <Avatar url={row.avatarUrl} name={row.displayName} size={36} frame={row.frame} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {row.userId && !row.isMe ? (
                        <Link
                          href={`/nguoi-dung/${row.userId}`}
                          className="hover:text-brand hover:underline"
                        >
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
                          <span className="text-muted text-[11px] font-semibold">
                            +{row.badges.length - 3}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="text-brand block font-bold tabular-nums">
                      {row.xp.toLocaleString("vi-VN")} XP
                    </span>
                    {prize > 0 ? (
                      <span className="text-muted block text-xs font-semibold tabular-nums">
                        🌾 {prize}
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        {meOutsideTop ? (
          <div className="border-brand bg-brand-soft flex items-center gap-3 rounded-2xl border px-4 py-3">
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
          <p className="bg-brand-soft rounded-2xl px-4 py-3 text-center text-sm">
            Bạn đang ẩn khỏi bảng xếp hạng.{" "}
            <Link href="/tai-khoan" className="text-brand font-semibold">
              Bật lại ở Cá nhân
            </Link>
          </p>
        ) : null}

        <p className="text-muted text-center text-xs">
          Tên hiển thị lấy từ tab Cá nhân. Nhớ +5 XP, quên +1 XP. Muốn ẩn tên, bật “Ẩn tôi khỏi
          bảng xếp hạng” ở Cá nhân.
        </p>
      </div>
    </>
  );
}
