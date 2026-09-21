import Link from "next/link";
import { Avatar } from "@/app/_components/avatar";
import { BadgeChip } from "@/app/_components/badge-chip";
import { isAiEnabled } from "@/lib/ai";
import { badgeByKey } from "@/lib/badges";
import { syncBadges } from "@/lib/badges";
import { DeckCover } from "@/app/_components/deck-cover";
import { ChevronRightIcon, FlameIcon, SparkleIcon } from "@/app/_components/icons";
import { InstallPrompt } from "@/app/_components/install-prompt";
import { Mascot } from "@/app/_components/mascot";
import { PageHeader } from "@/app/_components/page-header";
import { countDueReviews, listDecks } from "@/lib/decks";
import { getLeaderboard } from "@/lib/leaderboard";
import { awardStreakMilestones } from "@/lib/rewards";
import { getStudyStats } from "@/lib/stats";
import { getDailyTasks } from "@/lib/tasks";
import { getWeeklyQuests } from "@/lib/weekly";
import { createClient } from "@/lib/supabase/server";
import { DailyTaskList } from "./daily-tasks";
import { WeeklyQuestList } from "./weekly-quests";
import { GameCover } from "./tro-choi/game-cover";
import { GAMES } from "./tro-choi/games";

/** Số game gợi ý ở trang chủ; xoay vòng theo ngày để không nhàm. */
const FEATURED_GAMES = 3;

function dayOfYear(date = new Date()) {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86_400_000);
}

/** Vòng tròn tiến độ mục tiêu ngày, vẽ bằng SVG. */
function GoalRing({ value, max }: { value: number; max: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(1, max > 0 ? value / max : 0);
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={radius}
          className="stroke-white/25"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          className="stroke-white transition-[stroke-dashoffset] duration-700"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-xl font-bold tabular-nums">{value}</span>
        <span className="text-[11px] opacity-80">/{max} từ</span>
      </div>
    </div>
  );
}

export default async function Home() {
  const supabase = await createClient();

  // RLS chỉ trả về đúng hàng của người đang đăng nhập nên khỏi lọc theo id.
  // maybeSingle() để không ném lỗi nếu trigger tạo profile chưa chạy xong.
  const [{ data: profile }, stats, decks, board, dueReviews, tasks, weekly] = await Promise.all([
    supabase.from("profiles").select("display_name, daily_goal, placement").maybeSingle(),
    getStudyStats(),
    listDecks(),
    getLeaderboard("week", 3),
    countDueReviews(),
    getDailyTasks(),
    getWeeklyQuests(),
  ]);
  // Mốc chuỗi 3/7/14… ngày: thưởng một lần, ghi ngay khi ghé trang chủ.
  await awardStreakMilestones(stats.streak.current);
  // Huy hiệu vừa đạt: khoe một lần ở trang chủ, chi tiết ở Cá nhân.
  const { freshKeys } = await syncBadges(stats);
  const freshBadges = freshKeys.map(badgeByKey).filter((b) => b !== null);
  const topThree = board.filter((row) => row.rank <= 3);
  const myRank = board.find((row) => row.isMe);

  const name = profile?.display_name ?? "bạn";
  const dailyGoal = profile?.daily_goal ?? 10;
  const learnedToday = stats.today.words;
  const goalReached = learnedToday >= dailyGoal;
  const { level } = stats;

  // Bộ đáng ôn nhất: nhiều từ đến hạn nhất; hoà thì ưu tiên bộ của mình.
  const nextDeck = [...decks]
    .filter((deck) => deck.dueCount > 0)
    .sort(
      (a, b) => b.dueCount - a.dueCount || Number(b.isOwn) - Number(a.isOwn),
    )[0];
  const totalDue = decks.reduce((sum, deck) => sum + deck.dueCount, 0);

  // Chỉ xoay vòng trò chơi; kỹ năng có tab riêng.
  const games = GAMES.filter((game) => game.kind === "game");
  const offset = dayOfYear() % games.length;
  const featured = Array.from(
    { length: FEATURED_GAMES },
    (_, i) => games[(offset + i) % games.length],
  );

  // Dùng bản "trong" để vịt không có ô nền xanh đè lên nền gradient của hero.
  const mood = goalReached ? "an-mung" : learnedToday === 0 ? "ngu" : "chao-trong";
  const moodText = goalReached
    ? "Đã đạt mục tiêu hôm nay. Học thêm càng tốt!"
    : learnedToday === 0
      ? "Chưa học từ nào hôm nay. Bắt đầu thôi!"
      : `Còn ${dailyGoal - learnedToday} từ nữa là xong mục tiêu.`;

  return (
    <>
      <PageHeader title={`Chào ${name} 👋`} subtitle="Hôm nay học gì nào?" />

      <div className="space-y-6 px-5 pt-2">
        {/* Hero: mục tiêu ngày + chuỗi + cấp, vịt đổi tâm trạng theo tiến độ */}
        <section
          aria-labelledby="hom-nay"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-700 p-5 text-white shadow-lg shadow-brand/25"
        >
          <div className="flex items-center gap-4">
            <GoalRing value={learnedToday} max={dailyGoal} />
            <div className="min-w-0 flex-1">
              <h2 id="hom-nay" className="text-lg font-bold">
                Mục tiêu hôm nay
              </h2>
              <p className="mt-0.5 text-sm text-white/85">{moodText}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
                <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1">
                  <FlameIcon className="h-4 w-4" />
                  {stats.streak.current} ngày
                </span>
                <span className="rounded-full bg-white/20 px-2.5 py-1">
                  Cấp {level.level} · {level.title}
                </span>
              </div>
            </div>
            <Mascot
              variant={mood}
              size={112}
              priority
              className="hidden shrink-0 sm:block"
            />
          </div>

          <div className="mt-4 flex items-center gap-3 text-xs text-white/85">
            <div
              role="progressbar"
              aria-valuenow={level.current}
              aria-valuemin={0}
              aria-valuemax={level.needed}
              aria-label="XP tới cấp kế tiếp"
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/25"
            >
              <div
                className="h-full rounded-full bg-white transition-[width] duration-700"
                style={{ width: `${level.percent}%` }}
              />
            </div>
            <span className="tabular-nums">
              {level.current}/{level.needed} XP
            </span>
          </div>

          {/* Điện thoại: vịt nhỏ ở góc để hero không quá cao */}
          <Mascot
            variant={mood}
            size={80}
            priority
            className="absolute -right-1 -bottom-1 sm:hidden"
          />
        </section>

        {freshBadges.length > 0 ? (
          <Link
            href="/tai-khoan#huy-hieu"
            className="flex items-center gap-3 rounded-2xl border border-amber-300/60 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 press dark:border-amber-500/30 dark:from-amber-500/10 dark:to-yellow-500/10"
          >
            <span className="flex items-center -space-x-2">
              {freshBadges.slice(0, 3).map((badge) => (
                <BadgeChip key={badge.key} badge={badge} size={40} className="border-card border-2" />
              ))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">
                Huy hiệu mới: {freshBadges.map((b) => b.title).join(", ")}
              </span>
              <span className="text-muted block text-sm">Xem bộ sưu tập ở trang Cá nhân</span>
            </span>
            <ChevronRightIcon className="text-muted h-5 w-5 shrink-0" />
          </Link>
        ) : null}

        <DailyTaskList data={tasks} />
        <WeeklyQuestList data={weekly} />

        {/* Ôn tập: từ đã học tới hạn, gom từ mọi bộ — lõi của giãn cách */}
        {dueReviews > 0 ? (
          <section aria-labelledby="on-tap" className="space-y-3">
            <h2 id="on-tap" className="text-muted px-1 text-sm font-medium">
              Ôn tập hôm nay
            </h2>
            <Link
              href="/on-tap"
              className="group flex items-center gap-4 overflow-hidden rounded-2xl border border-amber-300/60 bg-gradient-to-r from-amber-50 to-orange-50 p-4 press dark:border-amber-500/30 dark:from-amber-500/10 dark:to-orange-500/10"
            >
              <span className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                <span className="text-2xl font-extrabold leading-none tabular-nums">{dueReviews}</span>
                <span className="mt-0.5 text-[10px] font-semibold uppercase">từ</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  {dueReviews} từ đến hạn ôn lại
                </span>
                <span className="text-muted mt-0.5 block text-sm">
                  Gom từ mọi bộ theo lịch giãn cách. Ôn đúng ngày thì nhớ lâu.
                </span>
              </span>
              <span className="flex min-h-10 shrink-0 items-center gap-1 rounded-xl bg-amber-500 px-4 text-sm font-bold text-white">
                Ôn ngay
                <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </section>
        ) : null}

        {/* Tiếp tục học */}
        <section aria-labelledby="tiep-tuc" className="space-y-3">
          <h2 id="tiep-tuc" className="text-muted px-1 text-sm font-medium">
            Tiếp tục học
          </h2>

          {nextDeck ? (
            <Link
              href={`/hoc/${nextDeck.id}`}
              className="border-border bg-card group flex items-center gap-4 overflow-hidden rounded-2xl border p-3 pr-4 press"
            >
              <DeckCover
                deck={nextDeck}
                sizes="96px"
                className="h-20 w-24 shrink-0 rounded-xl"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {nextDeck.name}
                </span>
                <span className="text-brand mt-0.5 block text-sm font-semibold">
                  {nextDeck.dueCount} từ đến hạn
                  {totalDue > nextDeck.dueCount
                    ? ` · ${totalDue} ở tất cả bộ`
                    : ""}
                </span>
                <span className="text-muted mt-0.5 block text-sm">
                  {nextDeck.wordCount} từ trong bộ
                </span>
              </span>
              <span className="bg-brand flex min-h-10 shrink-0 items-center gap-1 rounded-xl px-4 text-sm font-bold text-white">
                Ôn ngay
                <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ) : stats.totals.wordsSeen === 0 && !profile?.placement ? (
            <Link
              href="/kiem-tra-dau-vao"
              className="border-border bg-card flex items-center gap-4 rounded-2xl border p-4 press"
            >
              <Mascot variant="hoc" size={64} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">Bắt đầu bằng kiểm tra đầu vào</span>
                <span className="text-muted block text-sm">
                  20 câu, 3 phút — app gợi ý bộ vừa sức với bạn.
                </span>
              </span>
              <ChevronRightIcon className="text-muted h-5 w-5 shrink-0" />
            </Link>
          ) : decks.length === 0 ? (
            <Link
              href="/hoc"
              className="border-border bg-card flex items-center gap-4 rounded-2xl border p-4 press"
            >
              <Mascot variant="hoc" size={64} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">Chưa có bộ từ nào</span>
                <span className="text-muted block text-sm">
                  Vào tab Học để chọn bộ có sẵn hoặc tạo bộ riêng.
                </span>
              </span>
              <ChevronRightIcon className="text-muted h-5 w-5 shrink-0" />
            </Link>
          ) : (
            <Link
              href="/tro-choi"
              className="border-border bg-card flex items-center gap-4 rounded-2xl border p-4 press"
            >
              <Mascot variant="an-mung" size={64} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  Hôm nay ôn xong hết rồi
                </span>
                <span className="text-muted block text-sm">
                  Không còn từ nào tới hạn. Chơi vài ván cho nhớ lâu nhé.
                </span>
              </span>
              <ChevronRightIcon className="text-muted h-5 w-5 shrink-0" />
            </Link>
          )}
        </section>

        {isAiEnabled() ? (
          <Link
            href="/hoi-ai"
            className="border-border bg-card group flex items-center gap-4 rounded-2xl border p-4 press"
          >
            <span className="bg-brand-soft text-brand flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
              <SparkleIcon className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Hỏi AI</span>
              <span className="text-muted block text-sm">
                Nghĩa từ, ngữ pháp, sửa câu, luyện hội thoại — trả lời ngay bằng tiếng Việt.
              </span>
            </span>
            <ChevronRightIcon className="text-muted h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : null}

        {/* Chơi gì hôm nay: 3 bìa game xoay vòng theo ngày */}
        <section aria-labelledby="choi-gi" className="space-y-3">
          <div className="flex items-baseline justify-between px-1">
            <h2 id="choi-gi" className="text-muted text-sm font-medium">
              Chơi gì hôm nay
            </h2>
            <Link href="/tro-choi" className="text-brand text-sm font-semibold">
              Tất cả →
            </Link>
          </div>

          {/* Điện thoại: cuộn ngang có snap; màn rộng: lưới 3 cột */}
          <div className="stagger -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
            {featured.map((game) => (
              <Link
                key={game.slug}
                href={game.href}
                className="border-border bg-card group w-[68%] shrink-0 snap-start overflow-hidden rounded-2xl border press sm:w-[46%] md:w-auto"
              >
                <GameCover
                  game={game}
                  sizes="(min-width: 768px) 33vw, 68vw"
                  className="aspect-square"
                />
                <span className="flex items-center justify-between gap-2 p-3">
                  <span className="truncate font-semibold">{game.title}</span>
                  <ChevronRightIcon className="text-muted h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Bảng xếp hạng tuần: top 3 + vị trí của mình */}
        {topThree.length > 0 ? (
          <section aria-labelledby="xep-hang" className="space-y-3">
            <div className="flex items-baseline justify-between px-1">
              <h2 id="xep-hang" className="text-muted text-sm font-medium">
                Xếp hạng 7 ngày
              </h2>
              <Link href="/xep-hang" className="text-brand text-sm font-semibold">
                Xem bảng →
              </Link>
            </div>
            <Link
              href="/xep-hang"
              className="border-border bg-card block rounded-2xl border p-4 press"
            >
              <ol className="space-y-2">
                {topThree.map((row) => (
                  <li
                    key={row.rank}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="w-7 text-lg">
                      {["🥇", "🥈", "🥉"][row.rank - 1]}
                    </span>
                    <Avatar url={row.avatarUrl} name={row.displayName} size={28} />
                    <span className="min-w-0 flex-1 truncate font-semibold">
                      {row.userId && !row.isMe ? (
                        <Link href={`/nguoi-dung/${row.userId}`} className="hover:text-brand hover:underline">
                          {row.displayName}
                        </Link>
                      ) : (
                        row.displayName
                      )}
                      {row.isMe ? (
                        <span className="text-brand ml-2 text-xs">Bạn</span>
                      ) : null}
                    </span>
                    <span className="text-brand font-bold tabular-nums">
                      {row.xp} XP
                    </span>
                  </li>
                ))}
              </ol>
              {myRank && myRank.rank > 3 ? (
                <p className="text-muted border-border mt-3 border-t pt-3 text-sm">
                  Bạn đang hạng{" "}
                  <span className="text-fg font-bold">#{myRank.rank}</span> với{" "}
                  {myRank.xp} XP tuần này.
                </p>
              ) : null}
            </Link>
          </section>
        ) : null}

        <InstallPrompt />
      </div>
    </>
  );
}
