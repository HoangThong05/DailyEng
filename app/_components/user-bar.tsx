"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { checkIn } from "@/app/_actions/checkin";
import { playCorrect, unlockAudio } from "@/lib/game-audio";
import type { CheckinState } from "@/lib/rewards";
import type { UserBarData } from "@/lib/user-bar";
import { Avatar } from "./avatar";
import { BellIcon, FlameIcon } from "./icons";
import { useUserBar } from "./user-bar-context";

type Panel = "streak" | "bell" | null;

/**
 * Mục chuông đã xem, lưu theo ngày ở trình duyệt; mục mới phát sinh vẫn hiện số.
 * Đọc đồng bộ qua useSyncExternalStore: server không biết nên không vẽ số,
 * client vẽ ngay đúng số sau hydrate — không chớp số rồi mất.
 */
const SEEN_KEY = "dailyeng-bell-seen";
const seenListeners = new Set<() => void>();

function subscribeSeen(onChange: () => void) {
  seenListeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    seenListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readSeenRaw(): string {
  try {
    return localStorage.getItem(SEEN_KEY) ?? "";
  } catch {
    return "";
  }
}

function parseSeen(raw: string, today: string): Set<string> {
  try {
    const stored = raw ? (JSON.parse(raw) as { day: string; items: string[] }) : null;
    return stored && stored.day === today ? new Set(stored.items) : new Set();
  } catch {
    return new Set();
  }
}

function writeSeen(today: string, items: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify({ day: today, items: [...items] }));
  } catch {
    // Chế độ ẩn danh chặn localStorage — chỉ mất dấu "đã xem", không sao.
  }
  for (const listener of seenListeners) listener();
}

/**
 * Cụm nút góc trên: chuỗi ngày (mở bảng điểm danh), chuông (việc đang chờ),
 * avatar (tới Cá nhân). Không có dữ liệu (chưa đăng nhập) thì không hiện gì.
 * Dữ liệu lấy từ prop, không có thì từ context của layout app.
 */
export function UserBar({
  data: dataProp,
  showAvatar = false,
}: {
  data?: UserBarData;
  /** Trang giới thiệu bật; trong app tắt vì sidebar / tab Cá nhân đã có sẵn. */
  showAvatar?: boolean;
}) {
  const fromContext = useUserBar();
  const data = dataProp ?? fromContext;
  const [open, setOpen] = useState<Panel>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const today = data?.checkin.week.find((day) => day.isToday)?.day ?? "";
  // null = đang ở server / chưa hydrate → chưa vẽ số trên chuông.
  const seenRaw = useSyncExternalStore(subscribeSeen, readSeenRaw, () => null);
  const seen = seenRaw === null ? null : parseSeen(seenRaw, today);

  function markSeen(texts: string[]) {
    writeSeen(today, new Set([...(seen ?? []), ...texts]));
  }

  // Bấm ra ngoài hoặc Esc thì đóng.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!data) return null;

  const toggle = (panel: Panel) => {
    // Mở chuông là coi như đã xem hết mục đang có.
    if (panel === "bell" && open !== "bell") markSeen(data.notices.map((n) => n.text));
    setOpen((current) => (current === panel ? null : panel));
  };
  const pending = seen === null ? 0 : data.notices.filter((n) => !seen.has(n.text)).length;
  const chip =
    "border-border bg-card hover:border-brand/50 flex h-10 shrink-0 items-center justify-center rounded-full border shadow-sm press";

  return (
    <div ref={rootRef} className="relative flex shrink-0 items-center gap-2">
      {/* Thứ tự: chuỗi ngày · chuông · avatar (avatar ngoài cùng, chỉ trang giới thiệu) */}

      <button
        type="button"
        onClick={() => toggle("streak")}
        aria-expanded={open === "streak"}
        aria-label={`Chuỗi ${data.streak} ngày${data.checkin.checkedToday ? ", đã điểm danh" : ", chưa điểm danh"}. Mở điểm danh`}
        className={`${chip} gap-1 px-3 ${
          data.checkin.checkedToday ? "" : "ring-2 ring-amber-400/70"
        }`}
      >
        <FlameIcon className={`h-5 w-5 ${data.streak > 0 ? "text-orange-500" : "text-muted"}`} />
        <span className="text-sm font-bold tabular-nums">{data.streak}</span>
      </button>

      <button
        type="button"
        onClick={() => toggle("bell")}
        aria-expanded={open === "bell"}
        aria-label={pending > 0 ? `${pending} việc mới` : "Việc đang chờ"}
        className={`${chip} relative w-10`}
      >
        <BellIcon className="text-muted h-5 w-5" />
        {pending > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
            {pending}
          </span>
        ) : null}
      </button>

      {showAvatar ? (
        <Link href="/tai-khoan" aria-label="Trang cá nhân" className="relative shrink-0 press">
          <Avatar url={data.avatarUrl} name={data.name} size={40} className="border-border border shadow-sm" />
          <span className="bg-brand absolute -right-1 -bottom-1 rounded-full px-1.5 text-[10px] font-bold text-white shadow">
            Lv.{data.level}
          </span>
        </Link>
      ) : null}

      {open === "streak" ? (
        <CheckinPanel initial={data.checkin} streak={data.streak} onClose={() => setOpen(null)} />
      ) : null}
      {open === "bell" ? (
        <NoticePanel
          notices={data.notices}
          onClose={() => setOpen(null)}
          onOpenCheckin={() => setOpen("streak")}
        />
      ) : null}
    </div>
  );
}

const noticeClass =
  "hover:bg-brand-soft flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm";

const panelClass =
  "border-border bg-card pop-in absolute top-12 right-0 z-50 w-[min(20rem,calc(100vw-2.5rem))] rounded-2xl border p-4 shadow-xl shadow-black/10";

function CheckinPanel({
  initial,
  streak,
  onClose,
}: {
  initial: CheckinState;
  streak: number;
  onClose: () => void;
}) {
  const [state, setState] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCheckIn() {
    if (state.checkedToday || busy) return;
    setBusy(true);
    unlockAudio();
    const result = await checkIn();
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setState(result.state);
    if (result.xp > 0) {
      playCorrect();
      setMessage(`Điểm danh thành công, +${result.xp} XP đã cộng vào cấp độ.`);
    }
  }

  return (
    <div role="dialog" aria-label="Điểm danh" className={panelClass}>
      {/* Hai chuỗi khác nhau, đặt cạnh nhau cho khỏi lẫn: học ≠ điểm danh */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-orange-500/10 p-3 text-center">
          <FlameIcon className="mx-auto h-6 w-6 text-orange-500" />
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{streak}</p>
          <p className="text-muted text-[11px] font-semibold uppercase">ngày học liền</p>
        </div>
        <div className="bg-brand-soft rounded-2xl p-3 text-center">
          <span className="block text-2xl leading-6" aria-hidden>
            📅
          </span>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{state.consecutive}</p>
          <p className="text-muted text-[11px] font-semibold uppercase">ngày điểm danh liền</p>
        </div>
      </div>
      <p className="text-muted mt-2 text-center text-[11px] leading-snug">
        Chuỗi học tính theo ngày có trả lời ít nhất một từ. Điểm danh chỉ để nhận XP,
        không thay được việc học.
      </p>

      <p className="mt-4 text-center text-sm font-semibold">Điểm danh tuần này</p>
      <ol className="mt-2 flex justify-between">
        {state.week.map((day) => (
          <li key={day.day} className="flex flex-col items-center gap-1">
            <span className={`text-[11px] font-semibold ${day.isToday ? "text-brand" : "text-muted"}`}>
              {day.label}
            </span>
            <span
              aria-label={day.checked ? "Đã điểm danh" : undefined}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                day.checked
                  ? "bg-brand text-white"
                  : day.isToday
                    ? "border-brand border-2 border-dashed"
                    : "bg-brand-soft"
              }`}
            >
              {day.checked ? "✓" : ""}
            </span>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={handleCheckIn}
        disabled={state.checkedToday || busy}
        className={`mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold press ${
          state.checkedToday
            ? "bg-emerald-500/15 text-emerald-600"
            : "bg-brand text-white shadow-md shadow-brand/30"
        }`}
      >
        {state.checkedToday
          ? "✓ Đã điểm danh hôm nay"
          : busy
            ? "Đang ghi…"
            : `Điểm danh · +${state.nextXp} XP`}
      </button>

      {message ? (
        <p role="status" className="text-brand mt-2 text-center text-xs font-semibold">
          {message}
        </p>
      ) : null}

      <Link
        href="/phan-thuong"
        onClick={onClose}
        className="text-muted hover:text-brand mt-3 block text-center text-xs font-semibold"
      >
        Xem quy định thưởng →
      </Link>
    </div>
  );
}

function NoticePanel({
  notices,
  onClose,
  onOpenCheckin,
}: {
  notices: UserBarData["notices"];
  onClose: () => void;
  /** Mục "chưa điểm danh" mở bảng điểm danh ngay tại chỗ. */
  onOpenCheckin: () => void;
}) {
  return (
    <div role="dialog" aria-label="Việc đang chờ" className={`${panelClass} p-2`}>
      <p className="text-muted px-2 pt-1 pb-2 text-xs font-bold tracking-wide uppercase">
        Hôm nay
      </p>
      {notices.length === 0 ? (
        <p className="text-muted px-2 pb-2 text-sm">Không còn gì chờ. Tuyệt! 🎉</p>
      ) : (
        <ul className="space-y-1">
          {notices.map((notice) => (
            <li key={notice.text}>
              {notice.href === "#diem-danh" ? (
                <button type="button" onClick={onOpenCheckin} className={noticeClass}>
                  <span className="text-lg" aria-hidden>
                    {notice.emoji}
                  </span>
                  <span className="font-medium">{notice.text}</span>
                </button>
              ) : (
                <Link href={notice.href} onClick={onClose} className={noticeClass}>
                  <span className="text-lg" aria-hidden>
                    {notice.emoji}
                  </span>
                  <span className="font-medium">{notice.text}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
