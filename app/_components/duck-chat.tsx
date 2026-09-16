"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AiChat } from "./ai-chat";
import { CloseIcon } from "./icons";
import { Mascot } from "./mascot";

type Quota = { enabled: boolean; used: number; limit: number };

/**
 * Con vịt nổi ở góc dưới phải: bấm vào là mở khung chat với gia sư AI.
 * Hạn mức lấy khi mở lần đầu, nên trang nào cũng nhẹ. Trang /hoi-ai đã là
 * chat toàn màn hình nên ẩn con vịt đi cho khỏi trùng.
 */
export function DuckChat({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quota, setQuota] = useState<Quota | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || quota) return;
    let cancelled = false;
    fetch("/api/ai/chat")
      .then((res) => res.json() as Promise<Quota>)
      .then((data) => {
        if (!cancelled) setQuota(data);
      })
      .catch(() => {
        if (!cancelled) setQuota({ enabled: false, used: 0, limit: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [open, quota]);

  // Esc để đóng.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Chuyển trang thì đóng khung chat (đợi một khung hình, không setState thẳng trong effect).
  useEffect(() => {
    const frame = requestAnimationFrame(() => setOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  if (pathname.startsWith("/hoi-ai")) return null;

  return (
    <>
      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Hỏi AI"
          className="border-border bg-bg pop-in fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] flex h-[min(32rem,70dvh)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border shadow-2xl shadow-black/20 md:bottom-24"
        >
          <div className="border-border bg-brand-soft/60 flex shrink-0 items-center gap-3 border-b px-4 py-3">
            <Mascot variant="ai-tron" size={38} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Vịt gia sư</p>
              <p className="text-muted text-xs">Luôn sẵn sàng giúp bạn học tiếng Anh</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
              className="text-muted hover:text-fg flex h-8 w-8 shrink-0 items-center justify-center rounded-full press"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {quota === null ? (
            <p className="text-muted flex flex-1 items-center justify-center text-sm">Đang mở…</p>
          ) : quota.enabled ? (
            <AiChat used={quota.used} limit={quota.limit} name={name} variant="panel" />
          ) : (
            <p className="text-muted flex flex-1 items-center justify-center px-6 text-center text-sm">
              Hỏi AI chưa được bật trên máy chủ.
            </p>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          // Màn hẹp: khung nổi quá chật, mở thẳng trang chat toàn màn hình.
          if (window.innerWidth < 640) router.push("/hoi-ai");
          else setOpen(true);
        }}
        aria-label="Mở trò chuyện với Vịt gia sư"
        className={`bg-card border-border fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[55] flex h-16 w-16 items-center justify-center rounded-full border-2 shadow-xl shadow-black/15 transition-transform duration-300 hover:scale-105 active:scale-95 md:bottom-6 ${
          open ? "scale-0 opacity-0" : ""
        }`}
      >
        <Mascot variant="ai-tron" size={56} className="duck-float rounded-full" />
        <span className="bg-brand absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white shadow">
          AI
        </span>
      </button>
    </>
  );
}
