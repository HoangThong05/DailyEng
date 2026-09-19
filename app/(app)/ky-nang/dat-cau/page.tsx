import type { Metadata } from "next";
import { EmptyState } from "@/app/_components/empty-state";
import { PageHeader } from "@/app/_components/page-header";
import { isAiEnabled } from "@/lib/ai";
import { getPracticeWords } from "@/lib/sentence-practice";
import { SentenceSession } from "./sentence-session";

export const metadata: Metadata = { title: "Đặt câu với AI" };

export default async function DatCauPage() {
  if (!isAiEnabled()) {
    return (
      <>
        <PageHeader title="Đặt câu với AI" mascot="ai" />
        <EmptyState
          mascot="buon"
          title="Tính năng AI chưa được bật"
          description="Cần cấu hình khoá API trên máy chủ. Liên hệ người quản trị nhé."
        />
      </>
    );
  }

  const words = await getPracticeWords();

  return (
    <>
      <PageHeader
        title="Đặt câu với AI"
        subtitle="Viết một câu với từ vừa học — Vịt chấm và sửa ngay"
        mascot="ai"
      />
      {words.length === 0 ? (
        <EmptyState
          mascot="buon"
          title="Chưa có từ để luyện"
          description="Học vài từ ở tab Học rồi quay lại đây."
        />
      ) : (
        <div className="mx-auto w-full max-w-2xl px-5 pt-2 pb-4">
          <SentenceSession words={words} />
        </div>
      )}
    </>
  );
}
