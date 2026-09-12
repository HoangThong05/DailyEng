import type { Metadata } from "next";
import { ActionCard } from "@/app/_components/action-card";
import { GamepadIcon, MicIcon, QuizIcon } from "@/app/_components/icons";
import { PageHeader } from "@/app/_components/page-header";

export const metadata: Metadata = { title: "Trò chơi" };

/** Mỗi trò là một cách ôn khác nhau; tất cả đều ghi vào cùng hệ ôn tập. */
export default function TroChoiPage() {
  return (
    <>
      <PageHeader title="Trò chơi" subtitle="Chơi 5 phút, nhớ từ cả tuần" />

      <div className="grid gap-3 px-5 pt-2 md:grid-cols-2">
        <ActionCard
          href="/tro-choi/ghep-cap"
          title="Ghép cặp"
          description="Nối từ với nghĩa, đua với đồng hồ"
          icon={<GamepadIcon className="h-5 w-5" />}
        />
        <ActionCard
          href="/quiz"
          title="Quiz trắc nghiệm"
          description="Chọn nghĩa đúng trong 4 đáp án"
          icon={<QuizIcon className="h-5 w-5" />}
        />
        <ActionCard
          href="/phat-am"
          title="Luyện phát âm"
          description="Nghe mẫu, nói theo, chấm điểm"
          icon={<MicIcon className="h-5 w-5" />}
        />
      </div>
    </>
  );
}
