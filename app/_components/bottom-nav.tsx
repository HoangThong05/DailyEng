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
      <div className="border-border bg-card/85 mx-auto w-full max-w-md border-t backdrop-blur-lg">
        <ul className="pb-safe flex">
          {NAV_TABS.map(({ href, label, Icon }) => {
            const active = isTabActive(href, pathname);

            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  // min-h-14 = 56px, thoải mái trên mức 44px tối thiểu cho vùng chạm
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 transition-colors duration-200 active:scale-90 ${
                    active ? "text-brand" : "text-muted"
                  }`}
                >
                  {/* key đổi khi active đổi → icon nảy lên một cái */}
                  <Icon
                    key={active ? "on" : "off"}
                    className={`h-6 w-6 ${active ? "tab-pop" : ""}`}
                  />
                  <span className="text-[11px] leading-none font-medium">
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
