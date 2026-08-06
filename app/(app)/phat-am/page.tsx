import type { Metadata } from "next";
import { EmptyState } from "@/app/_components/empty-state";
import { MicIcon } from "@/app/_components/icons";
import { PageHeader } from "@/app/_components/page-header";

export const metadata: Metadata = { title: "Luyện phát âm" };

export default function PhatAmPage() {
  return (
    <>
      <PageHeader title="Luyện phát âm" subtitle="Nghe mẫu và nói theo" />
      <EmptyState
        icon={<MicIcon className="h-8 w-8" />}
        title="Chưa có bài luyện"
        description="Sẽ dùng Web Speech API để phát âm mẫu và chấm điểm khi bạn nói theo."
      />
    </>
  );
}
