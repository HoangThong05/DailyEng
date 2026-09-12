import type { Metadata } from "next";
import { PageHeader } from "@/app/_components/page-header";

export const metadata: Metadata = { title: "Không có mạng" };

/** Trang dự phòng được service worker cache sẵn, hiện khi mở trang lúc mất mạng. */
export default function OfflinePage() {
  return (
    <main className="flex-1">
      <PageHeader title="Không có mạng" />
      <div className="flex flex-col items-center px-8 py-16 text-center">
        {/*
         * Dùng <img> thường với file nhỏ nằm trong precache của service worker,
         * vì next/image cần mạng để tối ưu ảnh — đúng thứ trang này không có.
         */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascot/vit-chao-256.png"
          alt=""
          width={128}
          height={128}
          className="rounded-3xl"
        />
        <h2 className="mt-5 text-lg font-semibold">Bạn đang offline</h2>
        <p className="text-muted mt-2 text-sm leading-relaxed">
          Trang này chưa được lưu sẵn trong máy. Kết nối lại mạng rồi thử lại
          nhé.
        </p>
      </div>
    </main>
  );
}
