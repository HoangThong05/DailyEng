"use client";

import { useEffect, useState } from "react";

type Props = {
  value: number;
  /** Chữ nối sau số, ví dụ "%" hay " XP". */
  suffix?: string;
  prefix?: string;
  /** Thời gian chạy (ms). */
  duration?: number;
  className?: string;
};

/** Số đếm từ 0 lên giá trị thật, chậm dần về cuối — dùng cho số liệu nổi bật. */
export function CountUp({
  value,
  suffix = "",
  prefix = "",
  duration = 900,
  className,
}: Props) {
  // Server và lần render đầu hiện đúng giá trị để không nháy; effect chạy lại từ 0.
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (
      value === 0 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    // Mọi cập nhật đều nằm trong khung hình rAF, không setState thẳng trong effect.
    let frame = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}
