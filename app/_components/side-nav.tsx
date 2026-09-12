"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mascot } from "./mascot";
import { isTabActive, NAV_TABS } from "./nav-tabs";

/** Sidebar bên trái cho màn hình từ md trở lên; điện thoại dùng BottomNav. */
export function SideNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng chính"
      className="border-border bg-card fixed inset-y-0 left-0 z-50 hidden w-60 flex-col border-r md:flex"
    >
      <Link
        href="/"
        className="flex items-center gap-3 px-5 pt-6 pb-4"
        aria-label="Về trang chủ"
      >
        <Mascot variant="tot-nghiep" size={40} className="shrink-0 rounded-xl" />
        <span className="text-lg font-bold tracking-tight">DailyEng</span>
      </Link>

      <ul className="flex flex-1 flex-col gap-1 px-3">
        {NAV_TABS.map(({ href, label, Icon }) => {
          const active = isTabActive(href, pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 font-medium transition-[background-color,color,transform] duration-200 hover:translate-x-0.5 ${
                  active
                    ? "bg-brand-soft text-brand"
                    : "text-muted hover:bg-brand-soft/60 hover:text-fg"
                }`}
              >
                <Icon
                  key={active ? "on" : "off"}
                  className={`h-5 w-5 ${active ? "tab-pop" : ""}`}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
