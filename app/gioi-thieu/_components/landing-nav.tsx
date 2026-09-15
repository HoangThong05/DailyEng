"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "tinh-nang", label: "Tính năng" },
  { id: "tro-choi", label: "Trò chơi" },
  { id: "bo-tu", label: "Bộ từ" },
];

const PAGES = [
  { href: "/gioi-thieu", label: "Giới thiệu" },
  { href: "/gioi-thieu/ve-dailyeng", label: "Về DailyEng" },
  { href: "/gioi-thieu/tac-gia", label: "Tác giả" },
  { href: "/gioi-thieu/gop-y", label: "Góp ý" },
];

/**
 * Cụm tab viên ở header trang giới thiệu. Ở trang chủ giới thiệu: nhảy tới
 * từng mục và tự sáng theo mục đang xem (scrollspy). Ở trang thông tin: tab
 * chuyển giữa các trang.
 */
export function LandingNav({ anchors }: { anchors: boolean }) {
  const pathname = usePathname();
  const [current, setCurrent] = useState<string>("");

  useEffect(() => {
    if (!anchors) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Mục nào chiếm nhiều màn hình nhất thì sáng.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setCurrent(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.2, 0.5, 1] },
    );
    for (const section of SECTIONS) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [anchors]);

  if (anchors) {
    return (
      <nav aria-label="Mục trong trang" className="pill-tabs hidden md:inline-flex">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="pill-tab"
            aria-current={current === section.id ? "page" : undefined}
          >
            {section.label}
          </a>
        ))}
      </nav>
    );
  }

  return (
    <nav aria-label="Trang thông tin" className="pill-tabs hidden md:inline-flex">
      {PAGES.map((page) => (
        <Link
          key={page.href}
          href={page.href}
          className="pill-tab"
          aria-current={pathname === page.href ? "page" : undefined}
        >
          {page.label}
        </Link>
      ))}
    </nav>
  );
}
