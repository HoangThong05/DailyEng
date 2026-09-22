import Link from "next/link";

export type StudyMode = "the" | "chang";

/** Đọc chế độ từ ?che-do=; mặc định tuỳ trang truyền vào. */
export function readMode(value: string | string[] | undefined, fallback: StudyMode): StudyMode {
  return value === "the" || value === "chang" ? value : fallback;
}

/**
 * Tab chọn cách học ở đầu phiên: "Thẻ lật" (tự chấm, nhanh — hợp ôn từ đã
 * quen) hay "Theo chặng" (gặp → trắc nghiệm → gõ — hợp từ mới).
 */
export function ModeTabs({ mode, basePath }: { mode: StudyMode; basePath: string }) {
  const tabs: { key: StudyMode; label: string; hint: string }[] = [
    { key: "the", label: "Thẻ lật", hint: "tự chấm, nhanh" },
    { key: "chang", label: "Theo chặng", hint: "trắc nghiệm + gõ" },
  ];
  return (
    <nav aria-label="Cách học" className="pill-tabs mx-auto mt-2 w-full max-w-md md:max-w-2xl">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={`${basePath}?che-do=${tab.key}`}
          aria-current={mode === tab.key ? "page" : undefined}
          className="pill-tab flex flex-1 flex-col items-center leading-tight"
        >
          <span>{tab.label}</span>
          <span className="text-[10px] font-medium opacity-70">{tab.hint}</span>
        </Link>
      ))}
    </nav>
  );
}
