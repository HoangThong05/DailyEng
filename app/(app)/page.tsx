import { ActionCard } from "@/app/_components/action-card";
import {
  CardsIcon,
  FlameIcon,
  MicIcon,
  QuizIcon,
} from "@/app/_components/icons";
import { InstallPrompt } from "@/app/_components/install-prompt";
import { PageHeader } from "@/app/_components/page-header";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

// TODO: hai số này sẽ lấy từ bảng tiến độ học, làm cùng tính năng flashcard.
const streakDays = 0;
const learnedToday = 0;

export default async function Home() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  // maybeSingle() để không ném lỗi nếu trigger tạo profile chưa chạy xong.
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, daily_goal")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const name = profile?.display_name ?? user?.email?.split("@")[0] ?? "bạn";
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
              : `Còn ${dailyGoal - learnedToday} từ nữa là xong mục tiêu.`}
          </p>
        </section>

        <section aria-labelledby="bat-dau" className="space-y-3">
          <h2 id="bat-dau" className="text-muted px-1 text-sm font-medium">
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
        </section>

        <InstallPrompt />
      </div>
    </>
  );
}
