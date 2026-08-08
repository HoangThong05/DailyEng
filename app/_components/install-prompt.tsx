"use client";

import { useEffect, useState } from "react";
import { CloseIcon, ShareIcon } from "./icons";
import { useHydrated } from "./use-hydrated";

// Sự kiện này chưa có trong lib DOM của TypeScript nên phải tự khai báo.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "dailyeng:install-dismissed";

export function InstallPrompt() {
  const hydrated = useHydrated();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      // Chặn banner mặc định của Chrome để tự hiện thẻ gợi ý bên dưới
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!hydrated || dismissed) return null;

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari không hỗ trợ display-mode nên phải xem cờ riêng của nó
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  if (isStandalone || localStorage.getItem(DISMISS_KEY) === "1") return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Android/Chrome chỉ hiện khi bắt được sự kiện; iOS thì hướng dẫn thủ công.
  if (!deferred && !isIOS) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") setDismissed(true);
  }

  return (
    <div className="bg-brand-soft border-brand/20 relative rounded-2xl border p-4">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Đóng gợi ý cài đặt"
        className="text-muted absolute top-1 right-1 flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-100 active:scale-90"
      >
        <CloseIcon className="h-5 w-5" />
      </button>

      <p className="pr-10 text-sm font-semibold">Cài DailyEng vào máy</p>

      {deferred ? (
        <>
          <p className="text-muted mt-1 text-sm">
            Mở nhanh từ màn hình chính, dùng được cả khi không có mạng.
          </p>
          <button
            type="button"
            onClick={install}
            className="bg-brand mt-3 min-h-11 w-full rounded-xl px-4 text-sm font-semibold text-white transition-transform duration-100 active:scale-[0.97]"
          >
            Thêm vào màn hình chính
          </button>
        </>
      ) : (
        <p className="text-muted mt-1 flex flex-wrap items-center gap-1 text-sm">
          Bấm nút Chia sẻ
          <ShareIcon className="text-fg inline h-4 w-4" />
          ở thanh dưới Safari, rồi chọn
          <span className="text-fg font-medium">“Thêm vào MH chính”</span>.
        </p>
      )}
    </div>
  );
}
