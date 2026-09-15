import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/app/_actions/auth";
import { CountUp } from "@/app/_components/count-up";
import { Avatar } from "@/app/_components/avatar";
import { ChevronRightIcon, FlameIcon } from "@/app/_components/icons";
import { Mascot } from "@/app/_components/mascot";
import { PageHeader } from "@/app/_components/page-header";
import { listDecks } from "@/lib/decks";
import { COVER_PRESETS, parseCover } from "@/lib/profile";
import { DEFAULT_REMINDER_HOUR } from "@/lib/reminder";
import { getStudyStats } from "@/lib/stats";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { ImagePicker } from "./image-picker";
import { ProfileForm } from "./profile-form";
import { RankToggle } from "./rank-toggle";
import { ReminderToggle } from "./reminder-toggle";
import { ThemeToggle } from "./theme-toggle";
import { VoicePicker } from "./voice-picker";

export const metadata: Metadata = { title: "Cá nhân" };

function StatTile({
  value,
  suffix,
  label,
}: {
  value: number | null;
  suffix?: string;
  label: string;
}) {
  return (
    <div className="border-border bg-card rounded-2xl border p-3 text-center">
      <p className="text-xl font-bold tabular-nums">
        {value === null ? "—" : <CountUp value={value} suffix={suffix} />}
      </p>
      <p className="text-muted mt-0.5 text-xs">{label}</p>
    </div>
  );
}

export default async function TaiKhoanPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const [{ data: profile }, { streak, totals, level }, decks] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, daily_goal, reminder_hour, hide_rank, bio, avatar_url, cover")
      .eq("id", user?.id ?? "")
      .maybeSingle(),
    getStudyStats(),
    listDecks(),
  ]);
  const ownDecks = decks.filter((deck) => deck.isOwn);

  const displayName =
    profile?.display_name ?? user?.email?.split("@")[0] ?? "Bạn";
  const coverInfo = parseCover(profile?.cover);

  return (
    <>
      <PageHeader title="Cá nhân" mascot="tot-nghiep" />

      <div className="stagger mx-auto max-w-3xl space-y-5 px-5 pt-2 pb-4">
        {/* Thẻ hồ sơ: ảnh bìa (màu hoặc ảnh tải lên), avatar chồng lên mép, tên, tiểu sử, cấp, chuỗi */}
        <section aria-labelledby="ho-so" className="border-border bg-card overflow-hidden rounded-3xl border">
          <div
            className={`relative h-28 bg-gradient-to-br sm:h-36 ${COVER_PRESETS[coverInfo.preset].className}`}
          >
            {coverInfo.url ? (
              // eslint-disable-next-line @next/next/no-img-element -- ảnh người dùng tải lên, kích thước đã cố định
              <img src={coverInfo.url} alt="" className="h-full w-full object-cover" />
            ) : null}
            <Mascot variant="chao-trong" size={72} className="absolute right-4 bottom-2 h-auto w-16 opacity-90 sm:w-20" />
          </div>
          <div className="px-5 pb-5">
            <div className="relative z-10 -mt-10 flex items-end gap-4">
              <Avatar
                url={profile?.avatar_url}
                name={displayName}
                size={88}
                className="border-card shrink-0 border-4 shadow-lg"
              />
              <div className="min-w-0 flex-1 pb-1">
                <h2 id="ho-so" className="truncate text-xl font-bold">
                  {displayName}
                </h2>
                <p className="text-muted truncate text-xs">{user?.email}</p>
              </div>
            </div>
            {profile?.bio ? (
              <p className="mt-3 text-sm leading-relaxed">{profile.bio}</p>
            ) : (
              <p className="text-muted mt-3 text-sm">Chưa có tiểu sử — viết vài chữ ở phần Hồ sơ bên dưới.</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
              <span className="bg-brand-soft text-brand rounded-full px-2.5 py-1">
                Cấp {level.level} · {level.title}
              </span>
              <span className="bg-brand-soft text-brand flex items-center gap-1 rounded-full px-2.5 py-1">
                <FlameIcon className="h-4 w-4 text-orange-500" />
                {streak.current} ngày
                {streak.longest > streak.current ? ` · kỷ lục ${streak.longest}` : ""}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-3 text-xs">
              <div
                role="progressbar"
                aria-valuenow={level.current}
                aria-valuemin={0}
                aria-valuemax={level.needed}
                aria-label="Tiến độ lên cấp"
                className="bg-brand-soft h-2 flex-1 overflow-hidden rounded-full"
              >
                <div
                  className="bg-brand h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${level.percent}%` }}
                />
              </div>
              <span className="text-muted shrink-0 tabular-nums">
                <CountUp value={level.current} />/{level.needed} XP
              </span>
            </div>
          </div>
        </section>

        {/* Bốn con số chính; chi tiết ở trang Thống kê */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile value={totals.wordsSeen} label="từ đã học" />
          <StatTile value={totals.wordsMastered} label="từ đã thuộc" />
          <StatTile value={totals.accuracy} suffix="%" label="tỉ lệ nhớ" />
          <StatTile value={streak.longest} label="chuỗi dài nhất" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/tien-do"
            className="border-border bg-card flex min-h-12 items-center justify-between rounded-xl border px-4 text-sm font-semibold press"
          >
            Thống kê chi tiết
            <ChevronRightIcon className="text-muted h-4 w-4" />
          </Link>
          <Link
            href="/bo-cua-toi"
            className="border-border bg-card flex min-h-12 items-center justify-between rounded-xl border px-4 text-sm font-semibold press md:hidden"
          >
            Bộ của tôi ({ownDecks.length})
            <ChevronRightIcon className="text-muted h-4 w-4" />
          </Link>
          <Link
            href="/xep-hang"
            className="border-border bg-card flex min-h-12 items-center justify-between rounded-xl border px-4 text-sm font-semibold press md:hidden"
          >
            Bảng xếp hạng
            <ChevronRightIcon className="text-muted h-4 w-4" />
          </Link>
        </div>

        {/* Cài đặt: từng mục gập lại, mở cái nào cần */}
        <div className="space-y-3">
            <details className="border-border bg-card group rounded-2xl border">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-4 font-semibold [&::-webkit-details-marker]:hidden">
                Chỉnh sửa hồ sơ
                <span className="text-muted transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <div className="border-border border-t p-4">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar url={profile?.avatar_url} name={displayName} size={56} />
                  <ImagePicker kind="avatar" hasImage={!!profile?.avatar_url} />
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <span
                    className={`h-10 w-16 shrink-0 rounded-xl bg-gradient-to-br ${COVER_PRESETS[coverInfo.preset].className}`}
                    style={coverInfo.url ? { backgroundImage: `url(${coverInfo.url})`, backgroundSize: "cover" } : undefined}
                  />
                  <ImagePicker kind="cover" hasImage={!!coverInfo.url} />
                </div>
                <ProfileForm
                  displayName={displayName}
                  dailyGoal={profile?.daily_goal ?? 10}
                  bio={profile?.bio ?? ""}
                  cover={coverInfo.preset}
                  coverIsImage={!!coverInfo.url}
                />
              </div>
              </div>
            </details>

            <details className="border-border bg-card group rounded-2xl border">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-4 font-semibold [&::-webkit-details-marker]:hidden">
                Nhắc học
                <span className="text-muted transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <div className="border-border border-t p-4">
              <ReminderToggle
                vapidPublicKey={
                  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null
                }
                reminderHour={profile?.reminder_hour ?? DEFAULT_REMINDER_HOUR}
              />
              </div>
            </details>

            <details className="border-border bg-card group rounded-2xl border">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-4 font-semibold [&::-webkit-details-marker]:hidden">
                Bảng xếp hạng
                <span className="text-muted transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <div className="border-border border-t p-4">
              <RankToggle hidden={profile?.hide_rank ?? false} />
              </div>
            </details>

            <details className="border-border bg-card group rounded-2xl border">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-4 font-semibold [&::-webkit-details-marker]:hidden">
                Giao diện
                <span className="text-muted transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <div className="border-border border-t p-4">
              <ThemeToggle />
              </div>
            </details>

            <details className="border-border bg-card group rounded-2xl border">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-4 font-semibold [&::-webkit-details-marker]:hidden">
                Giọng đọc
                <span className="text-muted transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <div className="border-border border-t p-4">
              <VoicePicker />
              </div>
            </details>

        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="border-border min-h-11 w-full rounded-xl border text-sm font-semibold text-red-500 press"
          >
            Đăng xuất
          </button>
        </form>
      </div>
    </>
  );
}
