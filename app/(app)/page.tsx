import { ActionCard } from "@/app/_components/action-card";
import {
  CardsIcon,
  FlameIcon,
  GamepadIcon,
  MicIcon,
  QuizIcon,
} from "@/app/_components/icons";
import { InstallPrompt } from "@/app/_components/install-prompt";
import { PageHeader } from "@/app/_components/page-header";
import { getStudyStats } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  // RLS chỉ trả về đúng hàng của người đang đăng nhập nên khỏi lọc theo id —
  // nhờ vậy bỏ được một lượt xác thực JWT trên đường đi.
  // maybeSingle() để không ném lỗi nếu trigger tạo profile chưa chạy xong.
  const [{ data: profile }, stats] = await Promise.all([
    supabase.from("profiles").select("display_name, daily_goal").maybeSingle(),
    getStudyStats(),
  ]);

  const streakDays = stats.streak.current;
  const level = stats.level;
  const learnedToday = stats.today.words;
  const name = profile?.display_name ?? "bạn";
  const dailyGoal = profile?.daily_goal ?? 10;
  const progress = Math.min(100, Math.round((learnedToday / dailyGoal) * 100));

  return (
    <>
      <PageHeader
        title={`Chào ${name} 👋`}
        subtitle="Hôm nay học gì nào?"
        trailing={
          <span className="border-border bg-card flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5">
            <FlameIcon className="text-brand h-4 w-4" />
            <span className="text-sm font-semibold">{streakDays}</span>
          </span>
        }
      />

      <div className="space-y-6 px-5 pt-2">
        <section
          aria-labelledby="cap-do"
          className="border-border bg-card rounded-2xl border p-4"
        >
          <div className="flex items-center gap-3">
            <span className="bg-brand-soft text-brand flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold tabular-nums">
              {level.level}
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="cap-do" className="font-semibold">
                Cấp {level.level} · {level.title}
              </h2>
              <p className="text-muted text-sm tabular-nums">
                {level.current}/{level.needed} XP tới cấp {level.level + 1}
              </p>
            </div>
          </div>
          <div
            role="progressbar"
            aria-valuenow={level.current}
            aria-valuemin={0}
            aria-valuemax={level.needed}
            aria-labelledby="cap-do"
            className="bg-brand-soft mt-3 h-2 overflow-hidden rounded-full"
          >
            <div
              className="bg-brand h-full rounded-full transition-[width] duration-500"
              style={{ width: `${level.percent}%` }}
            />
          </div>
        </section>

        <section
          aria-labelledby="muc-tieu"
          className="border-border bg-card rounded-2xl border p-5"
        >
          <div className="flex items-baseline justify-between">
            <h2 id="muc-tieu" className="font-semibold">
              Mục tiêu hôm nay
            </h2>
            <p className="text-muted text-sm">
              <span className="text-fg font-semibold">{learnedToday}</span>/
              {dailyGoal} từ
            </p>
          </div>

          <div
            role="progressbar"
            aria-valuenow={learnedToday}
            aria-valuemin={0}
            aria-valuemax={dailyGoal}
            aria-labelledby="muc-tieu"
            className="bg-brand-soft mt-3 h-2.5 overflow-hidden rounded-full"
          >
            <div
              className="bg-brand h-full rounded-full transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-muted mt-3 text-sm">
            {learnedToday === 0
              ? "Chưa học từ nào hôm nay. Bắt đầu thôi!"
              : learnedToday >= dailyGoal
                ? "Đã đạt mục tiêu hôm nay. Học thêm càng tốt!"
                : `Còn ${dailyGoal - learnedToday} từ nữa là xong mục tiêu.`}
          </p>
        </section>

        <section
          aria-labelledby="bat-dau"
          className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"
        >
          <h2
            id="bat-dau"
            className="text-muted px-1 text-sm font-medium md:col-span-2 lg:col-span-4"
          >
            Bắt đầu học
          </h2>

          <ActionCard
            href="/hoc"
            title="Flashcard từ vựng"
            description="Lật thẻ, ghi nhớ từ mới"
            icon={<CardsIcon className="h-5 w-5" />}
          />
          <ActionCard
            href="/quiz"
            title="Quiz trắc nghiệm"
            description="Kiểm tra lại từ đã học"
            icon={<QuizIcon className="h-5 w-5" />}
          />
          <ActionCard
            href="/phat-am"
            title="Luyện phát âm"
            description="Nghe mẫu và nói theo"
            icon={<MicIcon className="h-5 w-5" />}
          />
          <ActionCard
            href="/tro-choi/ghep-cap"
            title="Ghép cặp"
            description="Nối từ với nghĩa, đua với đồng hồ"
            icon={<GamepadIcon className="h-5 w-5" />}
          />
        </section>

        <InstallPrompt />
      </div>
    </>
  );
}
