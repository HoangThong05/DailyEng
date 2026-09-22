import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Avatar } from "@/app/_components/avatar";
import { BadgeChip } from "@/app/_components/badge-chip";
import { CountUp } from "@/app/_components/count-up";
import { FlameIcon } from "@/app/_components/icons";
import { PageHeader } from "@/app/_components/page-header";
import { BADGE_GROUPS, BADGES, topBadges } from "@/lib/badges";
import { CoverArt } from "@/app/_components/cover-art";
import { TitleChip } from "@/app/_components/title-chip";
import { getFriendStatus } from "@/lib/friends";
import { getPublicProfile } from "@/lib/public-profile";
import { FriendAction } from "./friend-button";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps<"/nguoi-dung/[id]">) {
  const { id } = await params;
  const profile = UUID.test(id) ? await getPublicProfile(id) : null;
  return { title: profile ? profile.displayName : "Người học" };
}

/** Trang cá nhân công khai: bìa, avatar, tiểu sử, cấp, số tổng, huy hiệu. */
export default async function NguoiDungPage({ params }: PageProps<"/nguoi-dung/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const profile = await getPublicProfile(id);
  if (!profile) notFound();
  const friendStatus = await getFriendStatus(id);
  // Trang của chính mình thì về Cá nhân (có chỉnh sửa).
  if (profile.isMe) redirect("/tai-khoan");

  const earned = new Set(profile.badges);
  const featured = topBadges(profile.badges, 4);
  const tiles = [
    { value: profile.wordsSeen, label: "từ đã học" },
    { value: profile.wordsMastered, label: "từ đã thuộc" },
    { value: profile.reviews, label: "lượt trả lời" },
    { value: profile.streak.longest, label: "chuỗi dài nhất" },
  ];

  return (
    <>
      <PageHeader title={profile.displayName} subtitle="Trang cá nhân" />

      <div className="stagger grid gap-6 px-5 pt-2 pb-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-5">
          <section className="border-border bg-card overflow-hidden rounded-3xl border">
            <CoverArt info={profile.cover} className="h-32 sm:h-44" />
            <div className="px-5 pb-5">
              <div className="relative z-10 -mt-12 flex items-end gap-4">
                <Avatar
                  url={profile.avatarUrl}
                  name={profile.displayName}
                  size={104}
                  frame={profile.frame}
                  className="border-card shrink-0 border-4 shadow-lg"
                />
                <div className="min-w-0 flex-1 pb-1">
                  <h2 className="truncate text-2xl font-bold">{profile.displayName}</h2>
                  <TitleChip title={profile.title} />
                </div>
              </div>
              {profile.bio ? (
                <p className="mt-3 text-sm leading-relaxed">{profile.bio}</p>
              ) : (
                <p className="text-muted mt-3 text-sm">Chưa có tiểu sử.</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
                <span className="bg-brand-soft text-brand rounded-full px-2.5 py-1">
                  Cấp {profile.level.level} · {profile.level.title}
                </span>
                <span className="bg-brand-soft text-brand flex items-center gap-1 rounded-full px-2.5 py-1">
                  <FlameIcon className="h-4 w-4 text-orange-500" />
                  {profile.streak.current} ngày
                </span>
                <span className="bg-brand-soft text-brand rounded-full px-2.5 py-1 tabular-nums">
                  {profile.xp.toLocaleString("vi-VN")} XP
                </span>
              </div>
              <div className="mt-4">
                <FriendAction targetId={profile.userId} status={friendStatus} />
              </div>
              {featured.length > 0 ? (
                <div className="mt-4 flex items-center gap-2">
                  {featured.map((badge) => (
                    <BadgeChip key={badge.key} badge={badge} size={36} />
                  ))}
                  <span className="text-muted text-xs">{profile.badges.length} huy hiệu</span>
                </div>
              ) : null}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tiles.map((tile) => (
              <div key={tile.label} className="border-border bg-card rounded-2xl border p-4 text-center">
                <p className="text-2xl font-bold tabular-nums">
                  <CountUp value={tile.value} />
                </p>
                <p className="text-muted mt-0.5 text-xs">{tile.label}</p>
              </div>
            ))}
          </div>

          <Link
            href="/xep-hang"
            className="border-border bg-card flex min-h-12 items-center justify-center rounded-xl border text-sm font-semibold press"
          >
            ← Về bảng xếp hạng
          </Link>
        </div>

        <section aria-labelledby="huy-hieu" className="border-border bg-card rounded-2xl border p-4">
          <div className="flex items-center gap-2">
            <h2 id="huy-hieu" className="font-semibold">
              Huy hiệu
            </h2>
            <span className="bg-brand-soft text-brand rounded-full px-2 py-0.5 text-xs font-bold tabular-nums">
              {earned.size}/{BADGES.length}
            </span>
          </div>
          {BADGE_GROUPS.map((group) => (
            <div key={group.key} className="mt-3">
              <p className="text-muted text-xs font-semibold tracking-wide uppercase">{group.label}</p>
              <ul className="mt-1.5 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
                {BADGES.filter((badge) => badge.group === group.key).map((badge) => {
                  const has = earned.has(badge.key);
                  return (
                    <li
                      key={badge.key}
                      className={`flex items-center gap-2 rounded-xl p-1.5 ${has ? "" : "opacity-70"}`}
                    >
                      <BadgeChip badge={badge} earned={has} size={36} />
                      <span className="min-w-0">
                        <span className={`block truncate text-xs font-semibold ${has ? "" : "text-muted"}`}>
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
      </div>
    </>
  );
}
