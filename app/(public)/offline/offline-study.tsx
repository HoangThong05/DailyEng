"use client";

import { useEffect, useState } from "react";
import { CardSession } from "@/app/(app)/hoc/[deckId]/card-session";
import { enqueueReview, readPack, readQueue, type OfflinePack } from "@/lib/offline-store";

/** Tải lại thật sự (không qua router) để service worker thử mạng lại từ đầu. */
function reconnect() {
  window.location.assign(new URL("/", window.location.origin).href);
}

/**
 * Màn ôn khi mất mạng: dùng gói từ đã tải sẵn, chấm bằng thẻ lật, kết quả
 * xếp vào hàng đợi và tự đồng bộ khi có mạng lại (OfflineSync trong app).
 */
export function OfflineStudy() {
  // Đọc localStorage sau khi gắn để HTML server và client khớp nhau.
  const [pack, setPack] = useState<OfflinePack | null | undefined>(undefined);
  const [pending, setPending] = useState(0);
  const [studying, setStudying] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setPack(readPack());
      setPending(readQueue().length);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  if (pack === undefined) return null;

  if (!pack || pack.words.length === 0) {
    return (
      <p className="text-muted mt-2 text-sm leading-relaxed">
        Chưa có từ nào được lưu sẵn để ôn offline. Mở app lúc có mạng một lần, app sẽ tự tải
        gói từ đang học về máy.
      </p>
    );
  }

  if (studying) {
    return (
      <div className="w-full text-left">
        <CardSession
          title="Ôn offline"
          words={pack.words}
          onRate={(wordId, rating) => {
            enqueueReview(wordId, rating);
            setPending((n) => n + 1);
          }}
          footer={
            <div className="mt-8 w-full max-w-sm space-y-3">
              <p className="text-muted text-sm">
                {pending} lượt đang chờ — sẽ tự lưu khi có mạng lại.
              </p>
              <button
                type="button"
                onClick={reconnect}
                className="bg-brand flex min-h-12 w-full items-center justify-center rounded-xl font-semibold text-white press"
              >
                Thử kết nối lại
              </button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="mt-4 w-full max-w-sm space-y-3">
      <p className="text-muted text-sm leading-relaxed">
        Có <span className="text-fg font-semibold">{pack.words.length} từ</span> đang học đã lưu
        sẵn — ôn được ngay, kết quả tự lưu khi có mạng lại.
        {pending > 0 ? ` (${pending} lượt đang chờ)` : ""}
      </p>
      <button
        type="button"
        onClick={() => setStudying(true)}
        className="bg-brand flex min-h-12 w-full items-center justify-center rounded-xl font-semibold text-white press"
      >
        Ôn offline
      </button>
      <button
        type="button"
        onClick={reconnect}
        className="border-border text-muted flex min-h-12 w-full items-center justify-center rounded-xl border font-medium press"
      >
        Thử kết nối lại
      </button>
    </div>
  );
}
