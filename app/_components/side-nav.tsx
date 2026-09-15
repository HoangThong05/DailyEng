"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlameIcon } from "./icons";
import { Avatar } from "./avatar";
import { Mascot } from "./mascot";
import { isSideActive, NAV_TABS, SIDE_EXTRAS } from "./nav-tabs";

export type SideProfile = {
  name: string;
  avatarUrl: string | null;
  level: number;
  title: string;
  streak: number;
  /** 0–100 tiến độ tới cấp kế. */
  percent: number;
};

type Item = { href: string; label: string; Icon: (p: { className?: string }) => React.JSX.Element };

function NavItem({ item, active }: { item: Item; active: boolean }) {
  const Icon = item.Icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`group flex min-h-11 items-center gap-3 rounded-2xl px-3 font-semibold transition-[background-color,color,transform] duration-200 ${
        active ? "nav-active" : "text-muted hover:bg-brand-soft hover:text-fg hover:translate-x-1"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 ${
          active ? "bg-white/20" : "group-hover:-rotate-6 group-hover:scale-110"
        }`}
      >
        <Icon key={active ? "on" : "off"} className={`h-5 w-5 ${active ? "tab-pop" : ""}`} />
      </span>
      {item.label}
    </Link>
  );
}

/**
 * Sidebar bên trái cho màn hình từ md trở lên; điện thoại dùng BottomNav.
 * Trên: logo. Giữa: 4 tab học + mục phụ. Dưới: đăng xuất và thẻ hồ sơ
 * (bấm vào là tới Cá nhân).
 */
export function SideNav({ profile }: { profile: SideProfile }) {
  const pathname = usePathname();
  const mainTabs = NAV_TABS.filter((tab) => tab.href !== "/tai-khoan");
  const profileActive = isSideActive("/tai-khoan", pathname);

  return (
    <nav
      aria-label="Điều hướng chính"
      className="border-border bg-card/70 fixed inset-y-0 left-0 z-50 hidden w-60 flex-col border-r backdrop-blur-xl md:flex"
    >
      <Link
        href="/gioi-thieu"
        className="group flex items-center gap-3 px-5 pt-6 pb-4"
        aria-label="Trang giới thiệu DailyEng"
      >
        <Mascot
          variant="tot-nghiep"
          size={40}
          className="shrink-0 rounded-xl shadow-md shadow-blue-500/30 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
        />
        <span className="from-brand bg-gradient-to-r to-violet-500 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
          DailyEng
        </span>
      </Link>

      <ul className="flex flex-col gap-1 px-3">
        {mainTabs.map((item) => (
          <li key={item.href}>
            <NavItem item={item} active={isSideActive(item.href, pathname)} />
          </li>
        ))}
      </ul>

      <p className="text-muted mt-5 px-6 text-[11px] font-bold tracking-wide uppercase">Của tôi</p>
      <ul className="mt-1 flex flex-col gap-1 px-3">
        {SIDE_EXTRAS.map((item) => (
          <li key={item.href}>
            <NavItem item={item} active={isSideActive(item.href, pathname)} />
          </li>
        ))}
      </ul>

      {/* Thẻ hồ sơ dưới cùng: tên, cấp, chuỗi; bấm vào tới Cá nhân */}
      <Link
        href="/tai-khoan"
        aria-current={profileActive ? "page" : undefined}
        className={`border-border mx-3 mt-auto mb-4 flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
          profileActive ? "border-brand bg-brand-soft" : "bg-card hover:border-brand/50"
        }`}
      >
        <span className="relative shrink-0">
          <Avatar url={profile.avatarUrl} name={profile.name} size={44} />
          <span className="bg-brand absolute -right-1.5 -bottom-1.5 rounded-full px-1.5 text-[10px] font-bold text-white shadow">
            Lv.{profile.level}
          </span>
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold">{profile.name}</span>
          <span className="text-muted flex items-center gap-1 text-xs">
            {profile.title}
            <span aria-hidden>·</span>
            <FlameIcon className="h-3 w-3 text-orange-500" />
            {profile.streak}
          </span>
          <span className="bg-brand-soft mt-1.5 block h-1 overflow-hidden rounded-full">
            <span className="bg-brand block h-full rounded-full" style={{ width: `${profile.percent}%` }} />
          </span>
        </span>
      </Link>
    </nav>
  );
}
