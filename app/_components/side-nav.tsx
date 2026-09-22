"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { setSidebarCollapsed, useSidebarCollapsed } from "@/lib/sidebar-store";
import { signOut } from "@/app/_actions/auth";
import { ChevronRightIcon, FlameIcon, LogoutIcon } from "./icons";
import { Avatar } from "./avatar";
import { Mascot } from "./mascot";
import { isSideActive, NAV_TABS, SIDE_EXTRAS } from "./nav-tabs";
import { useAppShell } from "./user-bar-context";

type Item = { href: string; label: string; Icon: (p: { className?: string }) => React.JSX.Element };

function NavItem({ item, active, collapsed }: { item: Item; active: boolean; collapsed: boolean }) {
  const Icon = item.Icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={`side-item group flex min-h-11 items-center gap-3 rounded-2xl px-3 font-semibold transition-[background-color,color,transform] duration-200 ${
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
      <span className="side-label truncate">{item.label}</span>
    </Link>
  );
}

/**
 * Sidebar bên trái cho màn hình từ md trở lên; điện thoại dùng BottomNav.
 * Trên: logo. Giữa: 4 tab học + mục phụ. Dưới: thẻ hồ sơ (bấm vào là tới
 * Cá nhân). Nút thu gọn / mở rộng nằm cạnh logo; thu gọn thì chỉ còn icon, có tooltip.
 */
export function SideNav() {
  const pathname = usePathname();
  const collapsed = useSidebarCollapsed();
  const mainTabs = NAV_TABS.filter((tab) => tab.href !== "/tai-khoan");
  const profileActive = isSideActive("/tai-khoan", pathname);

  return (
    <nav
      aria-label="Điều hướng chính"
      className="side-nav border-border bg-card/70 fixed inset-y-0 left-0 z-50 hidden flex-col overflow-hidden border-r backdrop-blur-xl md:flex"
    >
      {/* Đầu sidebar: logo + nút thu gọn (icon tròn nhỏ, thu gọn thì xuống dưới logo) */}
      <div className="side-head flex items-center justify-between gap-2 px-[18px] pt-5 pb-3">
        <Link
          href="/gioi-thieu"
          className="group flex min-w-0 items-center gap-3"
          aria-label="Trang giới thiệu DailyEng"
          title={collapsed ? "DailyEng" : undefined}
        >
          <Mascot
            variant="tot-nghiep-trong"
            size={42}
            className="shrink-0 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
          />
          <span className="side-label from-brand bg-gradient-to-r to-emerald-500 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            DailyEng
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!collapsed)}
          aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
          title={collapsed ? "Mở rộng" : "Thu gọn"}
          className="border-border bg-card text-muted hover:text-brand hover:border-brand/50 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border press"
        >
          <ChevronRightIcon className={`h-4 w-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
        </button>
      </div>

      {/* Vùng cuộn: nhiều mục hơn chiều cao màn thì cuộn ở đây, không đẩy
          thẻ hồ sơ (lối vào Cá nhân) ra khỏi tầm nhìn. */}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
      <ul className="flex flex-col gap-1 px-3">
        {mainTabs.map((item) => (
          <li key={item.href}>
            <NavItem item={item} active={isSideActive(item.href, pathname)} collapsed={collapsed} />
          </li>
        ))}
      </ul>

      <p className="side-label text-muted mt-5 px-6 text-[11px] font-bold tracking-wide uppercase">Của tôi</p>
      {/* Thu gọn: thay chữ "Của tôi" bằng một vạch ngăn */}
      <div aria-hidden className="side-divider border-border mx-4 mt-4 hidden border-t" />
      <ul className="mt-1 flex flex-col gap-1 px-3">
        {SIDE_EXTRAS.map((item) => (
          <li key={item.href}>
            <NavItem item={item} active={isSideActive(item.href, pathname)} collapsed={collapsed} />
          </li>
        ))}
      </ul>
      </div>

      {/* Đăng xuất: mục riêng ngay trên thẻ hồ sơ, không nằm chung với cài đặt */}
      <form action={signOut} className="mt-2 px-3">
        <button
          type="submit"
          title={collapsed ? "Đăng xuất" : undefined}
          className="side-item group flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 font-semibold text-red-500 transition-[background-color,transform] duration-200 hover:bg-red-500/10 hover:translate-x-1"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
            <LogoutIcon className="h-5 w-5" />
          </span>
          <span className="side-label truncate">Đăng xuất</span>
        </button>
      </form>

      {/* Thẻ hồ sơ dưới cùng: tên, cấp, chuỗi; bấm vào tới Cá nhân.
          Dữ liệu về sau khung, nên có bản xương trong lúc chờ. */}
      <Suspense fallback={<ProfileCardSkeleton collapsed={collapsed} />}>
        <ProfileCard active={profileActive} collapsed={collapsed} />
      </Suspense>

    </nav>
  );
}

function ProfileCard({ active, collapsed }: { active: boolean; collapsed: boolean }) {
  const shell = useAppShell();
  if (!shell) return null;
  const profile = shell.sideProfile;
  return (
    <Link
      href="/tai-khoan"
      aria-current={active ? "page" : undefined}
      title={collapsed ? `${profile.name} · Cấp ${profile.level}` : undefined}
      className={`border-border mx-3 mt-2 mb-4 flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
        active ? "border-brand bg-brand-soft" : "bg-card hover:border-brand/50"
      } ${collapsed ? "justify-center px-0" : ""}`}
    >
      <span className="relative shrink-0">
        <Avatar url={profile.avatarUrl} name={profile.name} size={collapsed ? 36 : 44} frame={profile.frame} />
        <span className="bg-brand absolute -right-1.5 -bottom-1.5 rounded-full px-1.5 text-[10px] font-bold text-white shadow">
          Lv.{profile.level}
        </span>
      </span>
      <span className="side-label min-w-0">
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
  );
}

/** Bản xương của thẻ hồ sơ: cùng kích thước, nhấp nháy nhẹ, không nhảy bố cục. */
function ProfileCardSkeleton({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      aria-hidden
      className={`border-border bg-card mx-3 mt-2 mb-4 flex items-center gap-3 rounded-2xl border p-3 ${
        collapsed ? "justify-center px-0" : ""
      }`}
    >
      <span className="bg-brand-soft skeleton-pulse block shrink-0 rounded-full" style={{ width: collapsed ? 36 : 44, height: collapsed ? 36 : 44 }} />
      <span className="side-label min-w-0 flex-1 space-y-2">
        <span className="bg-brand-soft skeleton-pulse block h-3.5 w-24 rounded" />
        <span className="bg-brand-soft skeleton-pulse block h-2.5 w-16 rounded" />
        <span className="bg-brand-soft block h-1 w-full rounded-full" />
      </span>
    </div>
  );
}
