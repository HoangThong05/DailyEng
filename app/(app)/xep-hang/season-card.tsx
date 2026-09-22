"use client";

import { useEffect, useState } from "react";
import { Mascot } from "@/app/_components/mascot";
import { SEASON_PRIZES } from "@/lib/season-rules";

const MEDALS: Record<string, string> = { "1": "🥇", "2": "🥈", "3": "🥉" };

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/**
 * Thẻ mùa giải: đếm ngược tới lúc chốt tuần + bảng phần thưởng.
 * Đếm ngược chạy ở client để không phải làm mới trang.
 */
export function SeasonCard({ endsAt, label }: { endsAt: string; label: string }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const target = Date.parse(endsAt);
    const tick = () => setLeft(target - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const t = parts(left ?? 0);
  const boxes = [
    { value: t.days, label: "Ngày" },
    { value: t.hours, label: "Giờ" },
    { value: t.minutes, label: "Phút" },
    { value: t.seconds, label: "Giây" },
  ];

  return (
    <section className="border-brand/40 from-brand-soft/70 to-card relative overflow-hidden rounded-3xl border bg-gradient-to-br p-5">
      <Mascot
        variant="an-mung"
        size={92}
        className="pointer-events-none absolute -right-2 -bottom-2 h-auto w-20 opacity-25 sm:w-24"
      />

      <p className="text-muted text-center text-sm font-medium">
        Mùa tuần {label} · đóng sau
      </p>
      <div className="mt-2 flex items-center justify-center gap-1.5 sm:gap-2">
        {boxes.map((box, i) => (
          <div key={box.label} className="flex items-center gap-1.5 sm:gap-2">
            <div className="bg-card border-border min-w-14 rounded-xl border px-2 py-1.5 text-center shadow-sm">
              <p className="text-2xl font-bold tabular-nums">
                {left === null ? "--" : String(box.value).padStart(2, "0")}
              </p>
              <p className="text-muted text-[10px]">{box.label}</p>
            </div>
            {i < boxes.length - 1 ? <span className="text-muted font-bold">:</span> : null}
          </div>
        ))}
      </div>

      <div className="border-border mt-4 border-t pt-4">
        <p className="text-center font-semibold">🏆 Phần thưởng cuối tuần</p>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SEASON_PRIZES.map((prize) => (
            <li
              key={prize.rank}
              className="border-border bg-card rounded-2xl border p-2.5 text-center"
            >
              <p className="text-lg leading-none">{MEDALS[prize.rank] ?? "🎖️"}</p>
              <p className="mt-1 text-xs font-bold">Hạng {prize.rank}</p>
              <p className="text-brand mt-0.5 text-sm font-bold tabular-nums">
                🌾 {prize.seeds}
              </p>
              {prize.extra ? (
                <p className="text-muted mt-0.5 text-[10px] leading-tight">{prize.extra}</p>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="text-muted mt-3 text-center text-xs">
          Hạt và danh hiệu được cộng tự động khi tuần mới bắt đầu.
        </p>
      </div>
    </section>
  );
}
