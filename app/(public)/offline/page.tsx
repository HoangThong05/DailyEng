import type { Metadata } from "next";
import { EmptyState } from "@/app/_components/empty-state";
import { PageHeader } from "@/app/_components/page-header";

export const metadata: Metadata = { title: "Không có mạng" };

/** Trang dự phòng được service worker cache sẵn, hiện khi mở trang lúc mất mạng. */
export default function OfflinePage() {
  return (
    <main className="flex-1">
      <PageHeader title="Không có mạng" />
      <EmptyState
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8"
            aria-hidden
          >
            <path d="M3 3l18 18" />
            <path d="M8.5 15.5a5 5 0 0 1 6 0" />
            <path d="M5 12a10 10 0 0 1 3.5-2.3" />
            <path d="M15 9.7A10 10 0 0 1 19 12" />
            <path d="M2 8.8A15 15 0 0 1 8 5.6" />
            <path d="M13 5.2A15 15 0 0 1 22 8.8" />
            <path d="M12 19h.01" />
          </svg>
        }
        title="Bạn đang offline"
        description="Trang này chưa được lưu sẵn trong máy. Kết nối lại mạng rồi thử lại nhé."
      />
    </main>
  );
}
