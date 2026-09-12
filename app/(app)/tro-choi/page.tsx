import type { Metadata } from "next";
import { ActionCard } from "@/app/_components/action-card";
import {
  CloudRainIcon,
  GamepadIcon,
  MicIcon,
  QuizIcon,
  SpeakerIcon,
} from "@/app/_components/icons";
import { Mascot } from "@/app/_components/mascot";
import { PageHeader } from "@/app/_components/page-header";

export const metadata: Metadata = { title: "Trò chơi" };

/** Mỗi trò là một cách ôn khác nhau; tất cả đều ghi vào cùng hệ ôn tập. */
export default function TroChoiPage() {
  return (
    <>
      <PageHeader title="Trò chơi" subtitle="Chơi 5 phút, nhớ từ cả tuần" />

      <div className="px-5 pt-2 pb-4">
        <div className="border-border bg-card flex items-center gap-4 rounded-2xl border p-4">
          <Mascot variant="choi" size={96} className="shrink-0 rounded-2xl" />
          <p className="text-muted text-sm leading-relaxed">
            Mỗi trò là một cách ôn khác nhau. Chơi xong, từ nào nhớ hay quên
            đều được ghi lại và tính XP như khi học flashcard.
          </p>
        </div>
      </div>

      <div className="stagger grid gap-3 px-5 md:grid-cols-2">
        <ActionCard
          href="/tro-choi/ghep-cap"
          title="Ghép cặp"
          description="Nối từ với nghĩa, đua với đồng hồ"
          icon={<GamepadIcon className="h-5 w-5" />}
        />
        <ActionCard
          href="/tro-choi/nghe-go"
          title="Nghe & gõ"
          description="Nghe máy đọc, gõ đúng chính tả"
          icon={<SpeakerIcon className="h-5 w-5" />}
        />
        <ActionCard
          href="/tro-choi/mua-tu"
          title="Mưa từ vựng"
          description="Nghĩa rơi xuống, gõ từ để bắn"
          icon={<CloudRainIcon className="h-5 w-5" />}
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
