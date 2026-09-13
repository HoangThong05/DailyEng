"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isTabActive, NAV_TABS } from "./nav-tabs";

/** Tab bar dưới đáy, chỉ hiện trên điện thoại; màn hình lớn dùng SideNav. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-50 select-none md:hidden"
    >
      <div className="border-border bg-card/80 mx-auto w-full max-w-md border-t backdrop-blur-xl">
        <ul className="pb-safe flex">
          {NAV_TABS.map(({ href, label, Icon }) => {
            const active = isTabActive(href, pathname);

            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  // min-h-16 = 64px, thoải mái trên mức 44px tối thiểu cho vùng chạm
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 transition-colors duration-200 active:scale-90 ${
                    active ? "text-brand" : "text-muted"
                  }`}
                >
                  {/* Tab đang chọn: icon nằm trong viên gradient nhô lên; đổi tab thì viên phồng lên lại */}
                  <span
                    key={active ? "on" : "off"}
                    className={`flex h-8 items-center justify-center rounded-2xl transition-[width,transform] duration-300 ${
                      active
                        ? "nav-active w-14 -translate-y-0.5"
                        : "w-8 bg-transparent"
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${active ? "tab-pop" : ""}`} />
                  </span>
                  <span
                    className={`text-[11px] leading-none ${
                      active ? "font-bold" : "font-medium"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
