"use client";

import { useEffect, useState } from "react";
import { getMilestones, markCelebrated } from "@/app/_actions/study";
import { Mascot } from "./mascot";

const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899", "#22d3ee"];

/* Mảnh giấy cố định theo chỉ số để render ổn định, không cần Math.random. */
const PIECES = Array.from({ length: 48 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: ((i * 7) % 12) * 0.09,
  duration: 2.4 + (i % 5) * 0.35,
  rotate: (i * 53) % 360,
  color: COLORS[i % COLORS.length],
  size: 6 + (i % 3) * 3,
  round: i % 4 === 0,
}));

type Reason =
  | { kind: "goal"; goal: number }
  | { kind: "level"; level: number; title: string };

/**
 * Đặt ở màn kết quả cuối phiên. Sau một nhịp (để lượt lưu cuối kịp lên máy
 * chủ) hỏi máy chủ mốc hiện tại; đạt mục tiêu ngày lần đầu trong ngày hoặc
 * vừa lên cấp thì bung pháo giấy toàn màn. Mốc đã ăn mừng lưu ở profile nên
 * đổi máy / xoá dữ liệu trình duyệt cũng không ăn mừng lại.
 */
export function Celebration() {
  const [reason, setReason] = useState<Reason | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const m = await getMilestones().catch(() => null);
      if (!m || cancelled) return;

      if (m.celebratedLevel === 0) {
        // Lần đầu: ghi nhận cấp hiện tại, không ăn mừng cấp đã có từ trước.
        void markCelebrated("level", m.level);
      } else if (m.level > m.celebratedLevel) {
        void markCelebrated("level", m.level);
        setReason({ kind: "level", level: m.level, title: m.title });
        return;
      }

      if (m.goalReached && m.celebratedGoalOn !== m.today) {
        void markCelebrated("goal", m.today);
        setReason({ kind: "goal", goal: m.dailyGoal });
      }
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (!reason) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="an-mung"
      className="celebrate-in fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm"
      onClick={() => setReason(null)}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {PIECES.map((piece, i) => (
          <span
            key={i}
            className="confetti absolute top-0"
            style={{
              left: `${piece.left}%`,
              width: piece.size,
              height: piece.round ? piece.size : piece.size * 1.8,
              backgroundColor: piece.color,
              borderRadius: piece.round ? "50%" : 2,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              // Góc ban đầu, keyframe xoay thêm từ đây
              ["--r" as string]: `${piece.rotate}deg`,
            }}
          />
        ))}
      </div>

      <div
        className="celebrate-card bg-card relative w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <Mascot
          variant="an-mung"
          size={160}
          priority
          className="duck-bounce mx-auto"
        />
        <p className="from-brand bg-gradient-to-r to-emerald-500 bg-clip-text text-sm font-bold tracking-wide text-transparent uppercase">
          {reason.kind === "goal" ? "Mục tiêu hôm nay" : "Lên cấp"}
        </p>
        <h2 id="an-mung" className="mt-1 text-2xl font-extrabold">
          {reason.kind === "goal"
            ? `Xong ${reason.goal} từ rồi! 🎉`
            : `Cấp ${reason.level} · ${reason.title}`}
        </h2>
        <p className="text-muted mt-2 text-sm">
          {reason.kind === "goal"
            ? "Chuỗi ngày được giữ. Học thêm thì càng tốt."
            : "Tiếp tục đà này, cấp sau đang chờ."}
        </p>
        <button
          type="button"
          autoFocus
          onClick={() => setReason(null)}
          className="bg-brand mt-6 min-h-12 w-full rounded-xl font-semibold text-white press"
        >
          Tuyệt!
        </button>
      </div>
    </div>
  );
}
