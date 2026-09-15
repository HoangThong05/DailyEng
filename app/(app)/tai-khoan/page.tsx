import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/app/_actions/auth";
import { CountUp } from "@/app/_components/count-up";
import { FlameIcon } from "@/app/_components/icons";
import { Mascot } from "@/app/_components/mascot";
import { PageHeader } from "@/app/_components/page-header";
import { DeckCard } from "@/app/(app)/hoc/deck-card";
import { listDecks } from "@/lib/decks";
import { BOX_INTERVAL_DAYS } from "@/lib/leitner";
import { DEFAULT_REMINDER_HOUR } from "@/lib/reminder";
import { getDetailedStats, getStudyStats } from "@/lib/stats";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";
import { RankToggle } from "./rank-toggle";
import { ReminderToggle } from "./reminder-toggle";
import { ThemeToggle } from "./theme-toggle";
import { VoicePicker } from "./voice-picker";
import { WeekChart } from "./week-chart";

export const metadata: Metadata = { title: "Cá nhân" };

function StatTile({
  value,
  suffix,
  label,
}: {
  /** null = chưa có dữ liệu, hiện gạch ngang. */
  value: number | null;
  suffix?: string;
  label: string;
}) {
  return (
    <div className="border-border bg-card rounded-2xl border p-4 text-center">
      <p className="text-2xl font-bold tabular-nums">
        {value === null ? "—" : <CountUp value={value} suffix={suffix} />}
      </p>
      <p className="text-muted mt-0.5 text-xs">{label}</p>
    </div>
  );
}

function SectionTitle({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="text-muted px-1 text-sm font-medium">
      {children}
    </h2>
  );
}

export default async function TaiKhoanPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const [
    { data: profile },
    { streak, today, week, totals, level },
    detail,
    decks,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, daily_goal, reminder_hour, hide_rank, is_admin")
      .eq("id", user?.id ?? "")
      .maybeSingle(),
    getStudyStats(),
    getDetailedStats(),
    listDecks(),
  ]);
  const ownDecks = decks.filter((deck) => deck.isOwn);

  const displayName =
    profile?.display_name ?? user?.email?.split("@")[0] ?? "Bạn";
  const boxTotal = detail.boxes.reduce((sum, count) => sum + count, 0);
  const mood = streak.current > 0 ? "an-mung" : "chao";

  return (
    <>
      <PageHeader title="Cá nhân" mascot="tot-nghiep" />

      <div className="stagger space-y-6 px-5 pt-2 pb-4">
        {/* Thẻ hồ sơ: tên, cấp, XP, chuỗi — thay cho tiêu đề trang Tiến độ cũ */}
        <section
          aria-labelledby="ho-so"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-700 p-5 text-white shadow-lg shadow-blue-500/20"
        >
          <div className="flex items-center gap-4">
            <Mascot
              variant={mood}
              size={96}
              priority
              className="shrink-0 rounded-2xl"
            />
            <div className="min-w-0 flex-1">
              <h2 id="ho-so" className="truncate text-xl font-bold">
                {displayName}
              </h2>
              <p className="truncate text-sm text-white/80">{user?.email}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
                <span className="rounded-full bg-white/20 px-2.5 py-1">
                  Cấp {level.level} · {level.title}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1">
                  <FlameIcon className="h-4 w-4" />
                  {streak.current} ngày
                  {streak.longest > streak.current
                    ? ` · kỷ lục ${streak.longest}`
                    : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 text-xs text-white/85">
            <div
              role="progressbar"
              aria-valuenow={level.current}
              aria-valuemin={0}
              aria-valuemax={level.needed}
              aria-label="Tiến độ lên cấp"
              className="h-2 flex-1 overflow-hidden rounded-full bg-white/25"
            >
              <div
                className="h-full rounded-full bg-white transition-[width] duration-500"
                style={{ width: `${level.percent}%` }}
              />
            </div>
            <span className="shrink-0 tabular-nums">
              <CountUp value={level.current} />/{level.needed} XP
            </span>
          </div>
        </section>

        {/* Bộ từ tự tạo: của riêng mình nên nằm ở đây, tab Học chỉ còn bộ có sẵn */}
        <section aria-labelledby="bo-cua-toi" className="space-y-3">
          <div className="flex items-center gap-2">
            <SectionTitle id="bo-cua-toi">Bộ của tôi</SectionTitle>
            <span className="bg-brand-soft text-brand rounded-full px-2 py-0.5 text-xs font-bold tabular-nums">
              {ownDecks.length}
            </span>
          </div>
          <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ownDecks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
            <Link
              href="/hoc/tao"
              className="border-border text-muted hover:border-brand hover:text-brand flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors press"
            >
              <span className="bg-brand-soft text-brand flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold">
                +
              </span>
              <span className="font-semibold">Tạo bộ từ riêng</span>
              <span className="text-xs">
                Dán danh sách từ Excel, Sheets hay Quizlet
              </span>
            </Link>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Cột trái: tiến độ học */}
          <div className="space-y-6">
            <section aria-labelledby="hom-nay" className="space-y-3">
              <SectionTitle id="hom-nay">Hôm nay</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                <StatTile value={today.words} label="từ đã ôn" />
                <StatTile value={today.reviews} label="lượt ôn" />
                <StatTile
                  value={
                    today.reviews > 0
                      ? Math.round((today.correct / today.reviews) * 100)
                      : null
                  }
                  suffix="%"
                  label="nhớ được"
                />
              </div>
            </section>

            <section aria-labelledby="tong-ket" className="space-y-3">
              <SectionTitle id="tong-ket">Tổng kết</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                <StatTile value={totals.wordsSeen} label="từ đã học" />
                <StatTile
                  value={totals.wordsMastered}
                  label="từ đã thuộc"
                />
                <StatTile
                  value={totals.accuracy}
                  suffix="%"
                  label="tỉ lệ nhớ"
                />
              </div>
            </section>

            <section
              aria-labelledby="bay-ngay"
              className="border-border bg-card rounded-2xl border p-5"
            >
              <h2 id="bay-ngay" className="mb-4 font-semibold">
                7 ngày gần nhất
              </h2>
              <WeekChart week={week} />
            </section>

            {boxTotal > 0 ? (
              <section
                aria-labelledby="hop-on"
                className="border-border bg-card rounded-2xl border p-5"
              >
                <h2 id="hop-on" className="font-semibold">
                  Từ đang ở đâu
                </h2>
                <p className="text-muted mt-0.5 text-sm">
                  Nhớ đúng thì từ lên hộp cao hơn, lâu mới phải ôn lại.
                </p>
                <ul className="mt-4 space-y-2.5">
                  {detail.boxes.map((count, index) => {
                    const percent = Math.round((count / boxTotal) * 100);
                    const last = index === detail.boxes.length - 1;
                    return (
                      <li
                        key={index}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="text-muted w-20 shrink-0 tabular-nums">
                          {last
                            ? "Đã thuộc"
                            : `${BOX_INTERVAL_DAYS[index]} ngày`}
                        </span>
                        <span className="bg-brand-soft h-2.5 flex-1 overflow-hidden rounded-full">
                          <span
                            className={`block h-full rounded-full ${last ? "bg-brand" : "bg-brand/50"}`}
                            style={{ width: `${percent}%` }}
                          />
                        </span>
                        <span className="w-8 shrink-0 text-right font-semibold tabular-nums">
                          {count}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {detail.decks.length > 0 ? (
              <section aria-labelledby="theo-bo" className="space-y-3">
                <SectionTitle id="theo-bo">Theo bộ thẻ</SectionTitle>
                <ul className="border-border bg-card divide-border divide-y rounded-2xl border">
                  {detail.decks.map((deck) => (
                    <li
                      key={deck.deckId}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {deck.name}
                        </span>
                        <span className="text-muted block text-sm">
                          {deck.wordsSeen}/{deck.wordsTotal} từ đã học ·{" "}
                          {deck.reviews} lượt
                        </span>
                      </span>
                      <span
                        className={`shrink-0 text-lg font-bold tabular-nums ${
                          deck.accuracy !== null && deck.accuracy < 60
                            ? "text-red-500"
                            : ""
                        }`}
                      >
                        {deck.accuracy === null ? "—" : `${deck.accuracy}%`}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {detail.hardestWords.length > 0 ? (
              <section aria-labelledby="hay-sai" className="space-y-3">
                <SectionTitle id="hay-sai">Từ hay sai nhất</SectionTitle>
                <ul className="border-border bg-card divide-border divide-y rounded-2xl border">
                  {detail.hardestWords.map((word) => (
                    <li
                      key={word.wordId}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {word.term}
                          <span className="text-muted font-normal">
                            {" "}
                            · {word.meaning}
                          </span>
                        </span>
                        <span className="text-muted block truncate text-sm">
                          {word.deckName}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-sm font-semibold text-red-500 tabular-nums">
                          sai {word.wrong}/{word.reviews}
                        </span>
                        <span className="text-muted block text-xs">
                          hộp {word.box}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          {/* Cột phải: cài đặt */}
          <div className="space-y-6">
            <section aria-labelledby="cai-dat" className="space-y-3">
              <SectionTitle id="cai-dat">Hồ sơ & mục tiêu</SectionTitle>
              <div className="border-border bg-card rounded-2xl border p-4">
                <ProfileForm
                  displayName={displayName}
                  dailyGoal={profile?.daily_goal ?? 10}
                />
              </div>
            </section>

            <section aria-labelledby="nhac-hoc" className="space-y-3">
              <SectionTitle id="nhac-hoc">Nhắc học</SectionTitle>
              <ReminderToggle
                vapidPublicKey={
                  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null
                }
                reminderHour={profile?.reminder_hour ?? DEFAULT_REMINDER_HOUR}
              />
            </section>

            <section aria-labelledby="xep-hang" className="space-y-3">
              <SectionTitle id="xep-hang">Bảng xếp hạng</SectionTitle>
              <RankToggle hidden={profile?.hide_rank ?? false} />
            </section>

            <section aria-labelledby="giao-dien" className="space-y-3">
              <SectionTitle id="giao-dien">Giao diện</SectionTitle>
              <ThemeToggle />
            </section>

            <section aria-labelledby="giong-doc" className="space-y-3">
              <SectionTitle id="giong-doc">Giọng đọc</SectionTitle>
              <VoicePicker />
            </section>

            {profile?.is_admin ? (
              <Link
                href="/quan-tri"
                className="border-brand bg-brand-soft text-brand flex min-h-11 items-center justify-center rounded-xl border text-sm font-semibold press"
              >
                Vào khu quản trị
              </Link>
            ) : null}

            <form action={signOut}>
              <button
                type="submit"
                className="border-border min-h-11 w-full rounded-xl border text-sm font-semibold text-red-500 press"
              >
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
