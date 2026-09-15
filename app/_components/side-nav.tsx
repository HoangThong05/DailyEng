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
      className="border-border bg-card/70 fixed inset-y-0 left-0 z-50 hidden w-60 flex-col border-r backdrop-blur-xl md:flex"
    >
      <Link
        href="/gioi-thieu"
        className="group flex items-center gap-3 px-5 pt-6 pb-5"
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

      <ul className="flex flex-1 flex-col gap-1.5 px-3">
        {NAV_TABS.map(({ href, label, Icon }) => {
          const active = isTabActive(href, pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`group flex min-h-12 items-center gap-3 rounded-2xl px-3 font-semibold transition-[background-color,color,transform] duration-200 ${
                  active
                    ? "nav-active"
                    : "text-muted hover:bg-brand-soft hover:text-fg hover:translate-x-1"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 ${
                    active
                      ? "bg-white/20"
                      : "group-hover:-rotate-6 group-hover:scale-110"
                  }`}
                >
                  <Icon
                    key={active ? "on" : "off"}
                    className={`h-5 w-5 ${active ? "tab-pop" : ""}`}
                  />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
