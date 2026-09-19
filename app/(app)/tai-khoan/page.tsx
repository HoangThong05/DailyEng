import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/app/_actions/auth";
import { CountUp } from "@/app/_components/count-up";
import { Avatar } from "@/app/_components/avatar";
import { BadgeChip } from "@/app/_components/badge-chip";
import { ChevronRightIcon, FlameIcon, PencilIcon } from "@/app/_components/icons";
import { Mascot } from "@/app/_components/mascot";
import { OpenDetailsOnHash } from "@/app/_components/open-details-on-hash";
import { DeckCard } from "@/app/(app)/hoc/deck-card";
import { PageHeader } from "@/app/_components/page-header";
import { BADGE_GROUPS, BADGES, syncBadges } from "@/lib/badges";
import { listDecks } from "@/lib/decks";
import { COVER_PRESETS, parseCover } from "@/lib/profile";
import { DEFAULT_REMINDER_HOUR } from "@/lib/reminder";
import { getStudyStats } from "@/lib/stats";
import { RESET_PATH } from "@/lib/supabase/proxy";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { DeleteAccount } from "./delete-account";
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
    <div className="border-border bg-card rounded-2xl border p-4 text-center">
      <p className="text-2xl font-bold tabular-nums">
        {value === null ? "—" : <CountUp value={value} suffix={suffix} />}
      </p>
      <p className="text-muted mt-0.5 text-xs">{label}</p>
    </div>
  );
}

export default async function TaiKhoanPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const [{ data: profile }, stats, decks] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, daily_goal, reminder_hour, hide_rank, bio, avatar_url, cover")
      .eq("id", user?.id ?? "")
      .maybeSingle(),
    getStudyStats(),
    listDecks(),
  ]);
  const { streak, totals, level } = stats;
  const ownDecks = decks.filter((deck) => deck.isOwn);
  const badgeState = await syncBadges(stats);
  const earnedBadges = new Set(badgeState.earnedKeys);

  const displayName =
    profile?.display_name ?? user?.email?.split("@")[0] ?? "Bạn";
  // Đăng ký qua Google thì chưa có mật khẩu; nút đổi thành "Đặt mật khẩu".
  const { data: authUser } = await supabase.auth.getUser();
  const providers = (authUser.user?.app_metadata.providers as string[] | undefined) ?? [];
  const hasPassword = providers.includes("email");
  const coverInfo = parseCover(profile?.cover);

  return (
    <>
      <PageHeader title="Cá nhân" mascot="tot-nghiep" />
      <OpenDetailsOnHash />

      <div className="stagger grid gap-6 px-5 pt-2 pb-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        {/* Cột trái: hồ sơ, số liệu, lối tắt */}
        <div className="space-y-5">
        {/* Thẻ hồ sơ: ảnh bìa (màu hoặc ảnh tải lên), avatar chồng lên mép, tên, tiểu sử, cấp, chuỗi */}
        <section aria-labelledby="ho-so" className="border-border bg-card overflow-hidden rounded-3xl border">
          <div
            className={`relative h-32 bg-gradient-to-br sm:h-44 ${COVER_PRESETS[coverInfo.preset].className}`}
          >
            {coverInfo.url ? (
              // eslint-disable-next-line @next/next/no-img-element -- ảnh người dùng tải lên, kích thước đã cố định
              <img src={coverInfo.url} alt="" className="h-full w-full object-cover" />
            ) : null}
            <Mascot variant="chao-trong" size={72} className="absolute right-4 bottom-2 h-auto w-16 opacity-90 sm:w-20" />
          </div>
          <div className="px-5 pb-5">
            <div className="relative z-10 -mt-12 flex items-end gap-4">
              <Avatar
                url={profile?.avatar_url}
                name={displayName}
                size={104}
                className="border-card shrink-0 border-4 shadow-lg"
              />
              <div className="min-w-0 flex-1 pb-1">
                <h2 id="ho-so" className="truncate text-2xl font-bold">
                  {displayName}
                </h2>
                <p className="text-muted truncate text-xs">{user?.email}</p>
              </div>
              <a
                href="#chinh-sua"
                className="border-border bg-card mb-1 hidden min-h-10 shrink-0 items-center rounded-xl border px-4 text-sm font-semibold press sm:flex"
              >
                Chỉnh sửa
              </a>
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

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/tien-do"
            className="border-border bg-card flex min-h-12 items-center justify-between rounded-xl border px-4 text-sm font-semibold press"
          >
            Thống kê chi tiết
            <ChevronRightIcon className="text-muted h-4 w-4" />
          </Link>
          <Link
            href="/xep-hang"
            className="border-border bg-card flex min-h-12 items-center justify-between rounded-xl border px-4 text-sm font-semibold press"
          >
            Bảng xếp hạng
            <ChevronRightIcon className="text-muted h-4 w-4" />
          </Link>
        </div>

        {/* Huy hiệu: tất cả, đạt rồi thì sáng */}
        <section aria-labelledby="huy-hieu" className="border-border bg-card rounded-2xl border p-4">
          <div className="flex items-center gap-2">
            <h2 id="huy-hieu" className="font-semibold">
              Huy hiệu
            </h2>
            <span className="bg-brand-soft text-brand rounded-full px-2 py-0.5 text-xs font-bold tabular-nums">
              {earnedBadges.size}/{BADGES.length}
            </span>
          </div>
          {BADGE_GROUPS.map((group) => (
            <div key={group.key} className="mt-3">
              <p className="text-muted text-xs font-semibold tracking-wide uppercase">{group.label}</p>
              <ul className="mt-1.5 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
                {BADGES.filter((badge) => badge.group === group.key).map((badge) => {
                  const earned = earnedBadges.has(badge.key);
                  return (
                    <li
                      key={badge.key}
                      className={`flex items-center gap-2 rounded-xl p-1.5 ${earned ? "" : "opacity-70"}`}
                    >
                      <BadgeChip badge={badge} earned={earned} size={36} />
                      <span className="min-w-0">
                        <span className={`block truncate text-xs font-semibold ${earned ? "" : "text-muted"}`}>
                          {badge.title}
                        </span>
                        <span className="text-muted block truncate text-[11px]">{badge.description}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>

        {/* Bộ từ tự tạo */}
        <section aria-labelledby="bo-cua-toi" className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <h2 id="bo-cua-toi" className="text-muted text-sm font-medium">
              Bộ của tôi
            </h2>
            <span className="bg-brand-soft text-brand rounded-full px-2 py-0.5 text-xs font-bold tabular-nums">
              {ownDecks.length}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {ownDecks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
            <Link
              href="/hoc/tao"
              className="border-border text-muted hover:border-brand hover:text-brand flex min-h-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors press"
            >
              <span className="bg-brand-soft text-brand flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold">
                +
              </span>
              <span className="font-semibold">Tạo bộ từ riêng</span>
              <span className="text-xs">Dán danh sách từ Excel, Sheets hay Quizlet</span>
            </Link>
          </div>
        </section>
        </div>

        {/* Cột phải: cài đặt */}
        <div className="space-y-5">
            {/* Gập lại mặc định; id để nút "Chỉnh sửa" trên thẻ hồ sơ nhảy tới và mở */}
            <details id="chinh-sua" className="border-border bg-card group rounded-2xl border">
              <summary className="hover:bg-brand-soft/60 flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 transition-colors [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-3">
                  <span className="bg-brand-soft text-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                    <PencilIcon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">Chỉnh sửa hồ sơ</span>
                    <span className="text-muted block text-xs">Ảnh đại diện, ảnh bìa, tiểu sử, tên, mục tiêu</span>
                  </span>
                </span>
                <span className="bg-brand flex min-h-10 shrink-0 items-center gap-1 rounded-full px-4 text-sm font-bold text-white shadow-md shadow-brand/30 group-open:hidden">
                  Mở <span aria-hidden>▾</span>
                </span>
                <span className="border-border text-muted hidden min-h-10 shrink-0 items-center gap-1 rounded-full border px-4 text-sm font-semibold group-open:flex">
                  Thu gọn <span aria-hidden>▴</span>
                </span>
              </summary>
              <div className="border-border space-y-5 border-t p-4">
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
                {/* key theo bìa: tải/bỏ ảnh xong thì form nạp lại, không giữ màu cũ rồi ghi đè mất ảnh */}
                <ProfileForm
                  key={coverInfo.url ?? coverInfo.preset}
                  displayName={displayName}
                  dailyGoal={profile?.daily_goal ?? 10}
                  bio={profile?.bio ?? ""}
                  cover={coverInfo.preset}
                  coverIsImage={!!coverInfo.url}
                />
              </div>
            </details>

            <section className="space-y-3">
              <h2 className="text-muted px-1 text-sm font-medium">Nhắc học</h2>
              <div>
              <ReminderToggle
                vapidPublicKey={
                  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null
                }
                reminderHour={profile?.reminder_hour ?? DEFAULT_REMINDER_HOUR}
              />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-muted px-1 text-sm font-medium">Bảng xếp hạng</h2>
              <div>
              <RankToggle hidden={profile?.hide_rank ?? false} />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-muted px-1 text-sm font-medium">Giao diện</h2>
              <div>
              <ThemeToggle />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-muted px-1 text-sm font-medium">Giọng đọc</h2>
              <div>
              <VoicePicker />
              </div>
            </section>


            <section className="space-y-3">
              <h2 className="text-muted px-1 text-sm font-medium">Tài khoản</h2>
              <Link
                href={`${RESET_PATH}?ve=tai-khoan`}
                className="border-border bg-card flex min-h-12 items-center justify-between rounded-2xl border px-4 text-sm font-medium press"
              >
                {hasPassword ? "Đổi mật khẩu" : "Đặt mật khẩu (để đăng nhập không cần Google)"}
                <ChevronRightIcon className="text-muted h-4 w-4" />
              </Link>
            </section>

          <form action={signOut}>
            <button
              type="submit"
              className="border-border min-h-11 w-full rounded-xl border text-sm font-semibold text-red-500 press"
            >
              Đăng xuất
            </button>
          </form>

          <DeleteAccount />
        </div>
      </div>
    </>
  );
}
