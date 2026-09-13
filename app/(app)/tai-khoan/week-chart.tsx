import type { DayBar } from "@/lib/stats";

/** Biểu đồ cột 7 ngày gần nhất, vẽ bằng CSS thuần — không cần thư viện chart. */
export function WeekChart({ week }: { week: DayBar[] }) {
  const max = Math.max(...week.map((day) => day.reviews));

  return (
    <div className="flex h-36 items-end gap-2">
      {week.map((day) => {
        // max = 0 nghĩa là cả tuần chưa học gì, để cột lùn đều nhau.
        const percent = max > 0 ? (day.reviews / max) * 100 : 0;

        // Chọn đúng một class nền: Tailwind không ưu tiên theo thứ tự viết,
        // ghép nhiều class nền vào nhau sẽ ra kết quả khó đoán.
        const barClass =
          day.reviews === 0
            ? "bg-border"
            : day.isToday
              ? "bg-brand"
              : "bg-brand/45";

        return (
          <div
            key={day.day}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
          >
            <span className="text-muted text-[10px] tabular-nums">
              {day.reviews > 0 ? day.reviews : ""}
            </span>
            <div
              className={`w-full rounded-md transition-[height] duration-500 ${barClass}`}
              style={{ height: `${Math.max(percent, 4)}%` }}
              role="img"
              aria-label={`${day.label}: ${day.reviews} lượt ôn`}
            />
            <span
              className={`text-[11px] ${
                day.isToday ? "text-fg font-semibold" : "text-muted"
              }`}
            >
              {day.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}