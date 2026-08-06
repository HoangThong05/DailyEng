import type { Metadata } from "next";
import { EmptyState } from "@/app/_components/empty-state";
import { QuizIcon } from "@/app/_components/icons";
import { PageHeader } from "@/app/_components/page-header";

export const metadata: Metadata = { title: "Quiz" };

export default function QuizPage() {
  return (
    <>
      <PageHeader title="Quiz" subtitle="Trắc nghiệm" />
      <EmptyState
        icon={<QuizIcon className="h-8 w-8" />}
        title="Chưa có bộ câu hỏi"
        description="Câu hỏi sẽ sinh từ những từ bạn đã học, lấy về từ database."
      />
    </>
  );
}
