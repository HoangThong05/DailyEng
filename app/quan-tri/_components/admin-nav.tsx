"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/quan-tri", label: "Tổng quan" },
  { href: "/quan-tri/gop-y", label: "Góp ý" },
  { href: "/quan-tri/nguoi-dung", label: "Người dùng" },
  { href: "/quan-tri/noi-dung", label: "Nội dung" },
];

export function AdminNav({ pending }: { pending: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Quản trị" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
      {ITEMS.map((item) => {
        const active =
          item.href === "/quan-tri" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-10 shrink-0 items-center justify-between gap-2 rounded-xl px-3 text-sm font-semibold transition-colors ${
              active ? "nav-active" : "text-muted hover:bg-brand-soft hover:text-fg"
            }`}
          >
            {item.label}
            {item.href === "/quan-tri/gop-y" && pending > 0 ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  active ? "bg-white/25 text-white" : "bg-red-500 text-white"
                }`}
              >
                {pending}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
