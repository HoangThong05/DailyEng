import { addDays, todayInAppZone } from "@/lib/leitner";

/** Số tuần hiện trên bản đồ; cuộn ngang được nên màn hẹp vẫn xem hết. */
const WEEKS = 26;

/** Ngưỡng lượt/ngày cho 4 mức đậm. */
const LEVELS = [1, 10, 25, 50];

const LEVEL_CLASS = [
  "bg-border/50",
  "bg-brand/25",
  "bg-brand/50",
  "bg-brand/75",
  "bg-brand",
];

const MONTHS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

function levelOf(reviews: number) {
  let level = 0;
  for (const threshold of LEVELS) if (reviews >= threshold) level++;
  return level;
}

function weekdayOf(isoDay: string) {
  const [y, m, d] = isoDay.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = CN
}

function shortDate(isoDay: string) {
  const [, m, d] = isoDay.split("-");
  return `${Number(d)}/${Number(m)}`;
}

/**
 * Bản đồ nhiệt kiểu lịch: mỗi ô một ngày, cột là tuần (T2 trên, CN dưới),
 * càng học nhiều càng đậm. Vẽ tĩnh ở server, không cần JS.
 */
export function Heatmap({ history }: { history: { day: string; reviews: number }[] }) {
  const today = todayInAppZone();
  const byDay = new Map(history.map((row) => [row.day, row.reviews]));

  // Lùi về thứ Hai của tuần cách đây WEEKS-1 tuần.
  const todayWeekday = (weekdayOf(today) + 6) % 7; // 0 = T2
  const start = addDays(today, -(todayWeekday + 7 * (WEEKS - 1)));

  const weeks: { day: string; reviews: number; future: boolean }[][] = [];
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = "";
  for (let w = 0; w < WEEKS; w++) {
    const column = [];
    for (let d = 0; d < 7; d++) {
      const day = addDays(start, w * 7 + d);
      column.push({ day, reviews: byDay.get(day) ?? 0, future: day > today });
    }
    const month = column[0].day.slice(0, 7);
    if (month !== lastMonth) {
      // Ghi nhãn tháng ở cột đầu tiên có ngày đầu tuần rơi vào tháng mới.
      if (lastMonth !== "" || w === 0) monthLabels.push({ col: w, label: MONTHS[Number(month.slice(5)) - 1] });
      lastMonth = month;
    }
    weeks.push(column);
  }

  const activeDays = history.filter((row) => row.reviews > 0).length;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto" dir="rtl">
        <div dir="ltr" className="inline-block min-w-full">
          {/* Nhãn tháng */}
          <div
            className="text-muted mb-1 grid text-[10px]"
            style={{ gridTemplateColumns: `repeat(${WEEKS}, 1fr)`, marginLeft: "1.75rem" }}
          >
            {monthLabels.map(({ col, label }) => (
              <span key={col} style={{ gridColumnStart: col + 1 }}>
                {label}
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <div className="text-muted grid shrink-0 grid-rows-7 gap-1 text-[10px] leading-none" style={{ width: "1.5rem" }}>
              {["T2", "", "T4", "", "T6", "", "CN"].map((label, i) => (
                <span key={i} className="flex h-3 items-center">
                  {label}
                </span>
              ))}
            </div>
            <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${WEEKS}, 1fr)` }}>
              {weeks.map((column, w) => (
                <div key={w} className="grid grid-rows-7 gap-1">
                  {column.map((cell) => (
                    <span
                      key={cell.day}
                      title={
                        cell.future
                          ? undefined
                          : `${shortDate(cell.day)}: ${cell.reviews > 0 ? `${cell.reviews} lượt` : "không học"}`
                      }
                      className={`aspect-square h-3 w-full rounded-[3px] ${
                        cell.future ? "bg-transparent" : LEVEL_CLASS[levelOf(cell.reviews)]
                      } ${cell.day === today ? "ring-brand ring-1 ring-offset-1 ring-offset-card" : ""}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="text-muted flex items-center justify-between text-xs">
        <span>
          {activeDays} ngày có học
        </span>
        <span className="flex items-center gap-1">
          Ít
          {LEVEL_CLASS.map((cls) => (
            <span key={cls} className={`h-3 w-3 rounded-[3px] ${cls}`} />
          ))}
          Nhiều
        </span>
      </div>
    </div>
  );
}
