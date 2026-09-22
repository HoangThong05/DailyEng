import type { Metadata } from "next";
import { EmptyState } from "@/app/_components/empty-state";
import { PageHeader } from "@/app/_components/page-header";
import { listDecks } from "@/lib/decks";
import { buildPlacementQuestions } from "@/lib/placement-server";
import { PlacementSession } from "./placement-session";

export const metadata: Metadata = { title: "Kiểm tra đầu vào" };

export default async function KiemTraDauVaoPage() {
  const [questions, decks] = await Promise.all([buildPlacementQuestions(), listDecks()]);

  return (
    <>
      <PageHeader
        title="Kiểm tra đầu vào"
        subtitle={`${questions.length} câu · khoảng 3 phút · biết nên học bộ nào`}
        mascot="hoc"
      />
      {questions.length < 10 ? (
        <EmptyState
          mascot="buon"
          title="Chưa đủ dữ liệu để ra đề"
          description="Cần nạp các bộ từ có sẵn (supabase/seed) trước."
        />
      ) : (
        <div className="mx-auto w-full max-w-md md:max-w-2xl">
          <PlacementSession questions={questions} decks={decks} />
        </div>
      )}
    </>
  );
}
