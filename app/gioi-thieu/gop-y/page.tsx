import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { getCurrentUser } from "@/lib/supabase/server";
import { DocPage } from "../_components/doc-page";
import { FeedbackForm } from "./feedback-form";

export const metadata: Metadata = { title: "Góp ý" };

export default async function GopYPage() {
  const user = await getCurrentUser();

  return (
    <DocPage
      title="Góp ý"
      subtitle="Gặp lỗi, muốn thêm tính năng hay bộ từ — viết vài dòng, không cần đăng nhập."
    >
      <FeedbackForm defaultEmail={user?.email ?? ""} />
      <p className="text-sm">
        Hoặc gửi email thẳng tới{" "}
        <a href={`mailto:${SITE.author.email}`}>{SITE.author.email}</a>.
      </p>
    </DocPage>
  );
}
