"use client";

import { useEffect, useState } from "react";
import { Mascot } from "@/app/_components/mascot";
import { useHydrated } from "@/app/_components/use-hydrated";
import { formatHour, REMINDER_HOURS } from "@/lib/reminder";
import {
  removePushSubscription,
  savePushSubscription,
  sendTestPush,
  updateReminderHour,
} from "./push-actions";

type Status = "loading" | "off" | "on" | "busy";

/** Những điều chỉ biết được ở trình duyệt, tính một lần sau khi hydrate. */
type Capability = "supported" | "unsupported" | "needs-install";

function detectCapability(): Capability {
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return "unsupported";
  }
  // iOS chỉ cho push khi app đã được thêm vào màn hình chính.
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return isIOS && !isStandalone() ? "needs-install" : "supported";
}

/** Khoá VAPID public ở dạng base64url; pushManager cần Uint8Array. */
function toUint8Array(base64url: string) {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

type Props = {
  /** null khi server chưa cấu hình khoá — ẩn hẳn tính năng. */
  vapidPublicKey: string | null;
  /** Giờ nhắc đang lưu trong profile (giờ VN). */
  reminderHour: number;
};

export function ReminderToggle({ vapidPublicKey, reminderHour }: Props) {
  const hydrated = useHydrated();
  const capability: Capability | null = hydrated ? detectCapability() : null;

  const [status, setStatus] = useState<Status>("loading");
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [message, setMessage] = useState<{ text: string; error?: boolean }>();
  const [hour, setHour] = useState(reminderHour);

  useEffect(() => {
    if (capability !== "supported") return;

    let cancelled = false;
    navigator.serviceWorker
      .getRegistration()
      .then((registration) => registration?.pushManager.getSubscription())
      .then((existing) => {
        if (cancelled) return;
        setSubscription(existing ?? null);
        setStatus(existing ? "on" : "off");
      })
      .catch(() => {
        if (!cancelled) setStatus("off");
      });

    return () => {
      cancelled = true;
    };
  }, [capability]);

  async function turnOn() {
    if (!vapidPublicKey) return;
    setStatus("busy");
    setMessage(undefined);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage({
          text: "Bạn đã chặn thông báo. Mở cài đặt trình duyệt để cho phép lại.",
          error: true,
        });
        setStatus("off");
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setMessage({
          text: "Service worker chưa chạy — tính năng này chỉ có ở bản đã deploy.",
          error: true,
        });
        setStatus("off");
        return;
      }

      const fresh = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toUint8Array(vapidPublicKey),
      });

      const json = fresh.toJSON();
      const result = await savePushSubscription({
        endpoint: fresh.endpoint,
        keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
      });

      if (!result.ok) {
        // Server không lưu được thì gỡ luôn ở trình duyệt cho khớp trạng thái.
        await fresh.unsubscribe();
        setMessage({ text: result.error, error: true });
        setStatus("off");
        return;
      }

      setSubscription(fresh);
      setStatus("on");
      setMessage({
        text: `Sẽ nhắc bạn lúc ${formatHour(hour)} mỗi ngày chưa học.`,
      });
    } catch (error) {
      console.error(error);
      setMessage({ text: "Không bật được nhắc học. Thử lại nhé.", error: true });
      setStatus("off");
    }
  }

  async function turnOff() {
    if (!subscription) return;
    setStatus("busy");
    setMessage(undefined);

    await removePushSubscription(subscription.endpoint);
    await subscription.unsubscribe();

    setSubscription(null);
    setStatus("off");
    setMessage({ text: "Đã tắt nhắc học." });
  }

  async function chooseHour(next: number) {
    const previous = hour;
    setHour(next);
    setMessage(undefined);
    const result = await updateReminderHour(next);
    if (!result.ok) {
      setHour(previous);
      setMessage({ text: result.error, error: true });
    }
  }

  async function sendTest() {
    if (!subscription) return;
    setMessage(undefined);
    const result = await sendTestPush(subscription.endpoint);
    setMessage(
      result.ok
        ? { text: "Đã gửi. Thông báo sẽ hiện trong vài giây." }
        : { text: result.error, error: true },
    );
  }

  const cardClass = "border-border bg-card rounded-2xl border p-4";

  if (!vapidPublicKey || capability === "unsupported") {
    return (
      <div className={cardClass}>
        <p className="font-medium">Nhắc học mỗi ngày</p>
        <p className="text-muted mt-1 text-sm">
          {vapidPublicKey
            ? "Trình duyệt này không hỗ trợ thông báo đẩy."
            : "Chưa cấu hình trên máy chủ."}
        </p>
      </div>
    );
  }

  if (capability === "needs-install") {
    return (
      <div className={cardClass}>
        <p className="font-medium">Nhắc học mỗi ngày</p>
        <p className="text-muted mt-1 text-sm">
          Trên iPhone, hãy thêm DailyEng vào màn hình chính trước, rồi bật nhắc
          học từ trong app.
        </p>
      </div>
    );
  }

  const on = status === "on";
  const busy = status === "busy" || status === "loading";

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Mascot variant="ngu" size={56} className="shrink-0" />
          <div className="min-w-0">
            <p className="font-medium">Nhắc học mỗi ngày</p>
            <p className="text-muted mt-0.5 text-sm">
              Chỉ nhắc khi hôm đó bạn chưa học.
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Nhắc học mỗi ngày"
          disabled={busy}
          onClick={on ? turnOff : turnOn}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
            on ? "bg-brand" : "bg-border"
          }`}
        >
          <span
            className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
              on ? "translate-x-6" : ""
            }`}
          />
        </button>
      </div>

      {on ? (
        <div
          role="radiogroup"
          aria-label="Giờ nhắc"
          className="bg-brand-soft mt-4 flex rounded-xl p-1"
        >
          {REMINDER_HOURS.map((option) => {
            const active = hour === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => chooseHour(option)}
                className={`min-h-11 flex-1 rounded-lg text-sm font-semibold transition-colors ${
                  active ? "bg-card text-fg shadow-sm" : "text-muted"
                }`}
              >
                {formatHour(option)}
              </button>
            );
          })}
        </div>
      ) : null}

      {on ? (
        <button
          type="button"
          onClick={sendTest}
          className="border-border mt-4 min-h-11 w-full rounded-xl border text-sm font-semibold press"
        >
          Gửi thông báo thử
        </button>
      ) : null}

      {message ? (
        <p
          role={message.error ? "alert" : "status"}
          className={`mt-3 text-sm ${
            message.error ? "font-medium text-red-500" : "text-muted"
          }`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
