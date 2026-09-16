import type { Metadata } from "next";
import { EmptyState } from "@/app/_components/empty-state";
import { PageHeader } from "@/app/_components/page-header";
import { getAiQuota } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { AiChat } from "@/app/_components/ai-chat";

export const metadata: Metadata = { title: "Hỏi AI" };

export default async function HoiAiPage({ searchParams }: PageProps<"/hoi-ai">) {
  const [{ q }, quota, supabase] = await Promise.all([searchParams, getAiQuota(), createClient()]);
  const { data: profile } = await supabase.from("profiles").select("display_name").maybeSingle();
  const question = typeof q === "string" ? q.slice(0, 500) : undefined;

  return (
    <>
      <PageHeader
        title="Hỏi AI"
        subtitle="Gia sư tiếng Anh trả lời ngay, bằng tiếng Việt"
        mascot="noi"
      />
      {quota.enabled ? (
        <div className="mx-auto w-full max-w-2xl">
          <AiChat
            used={quota.used}
            limit={quota.limit}
            initialQuestion={question}
            name={profile?.display_name ?? "bạn"}
          />
        </div>
      ) : (
        <EmptyState
          mascot="ngu"
          title="Hỏi AI chưa được bật"
          description="Máy chủ chưa cấu hình khoá Claude API. Bật xong là hỏi được ngay."
        />
      )}
    </>
  );
}
