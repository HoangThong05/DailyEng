import type { Metadata } from "next";
import { PageHeader } from "@/app/_components/page-header";
import { OfflineStudy } from "./offline-study";

export const metadata: Metadata = { title: "Không có mạng" };

/**
 * Trang dự phòng được service worker cache sẵn, hiện khi mở trang lúc mất
 * mạng. Có gói từ tải sẵn thì ôn được luôn, không thì chỉ báo mất mạng.
 */
export default function OfflinePage() {
  return (
    <main className="flex-1">
      <PageHeader title="Không có mạng" />
      <div className="flex flex-col items-center px-6 py-10 text-center">
        {/*
         * Dùng <img> thường với file nhỏ nằm trong precache của service worker,
         * vì next/image cần mạng để tối ưu ảnh — đúng thứ trang này không có.
         */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascot/vit-chao-256.png"
          alt=""
          width={112}
          height={112}
          className="rounded-3xl"
        />
        <h2 className="mt-4 text-lg font-semibold">Bạn đang offline</h2>
        <OfflineStudy />
      </div>
    </main>
  );
}
