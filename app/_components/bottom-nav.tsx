"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CardsIcon, ChartIcon, HomeIcon, QuizIcon } from "./icons";

const TABS = [
  { href: "/", label: "Trang chủ", Icon: HomeIcon },
  { href: "/hoc", label: "Học", Icon: CardsIcon },
  { href: "/quiz", label: "Quiz", Icon: QuizIcon },
  { href: "/tien-do", label: "Tiến độ", Icon: ChartIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-50 select-none"
    >
      <div className="border-border bg-card/85 mx-auto w-full max-w-md border-t backdrop-blur-lg">
        <ul className="pb-safe flex">
          {TABS.map(({ href, label, Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  // min-h-14 = 56px, thoải mái trên mức 44px tối thiểu cho vùng chạm
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 transition-transform duration-100 active:scale-90 ${
                    active ? "text-brand" : "text-muted"
                  }`}
                >
                  <Icon className="h-6 w-6" />
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
