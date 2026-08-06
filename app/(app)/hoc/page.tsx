import type { Metadata } from "next";
import { EmptyState } from "@/app/_components/empty-state";
import { CardsIcon } from "@/app/_components/icons";
import { PageHeader } from "@/app/_components/page-header";

export const metadata: Metadata = { title: "Học từ vựng" };

export default function HocPage() {
  return (
    <>
      <PageHeader title="Học từ vựng" subtitle="Flashcard" />
      <EmptyState
        icon={<CardsIcon className="h-8 w-8" />}
        title="Chưa có bộ thẻ nào"
        description="Bộ thẻ sẽ được nạp từ database sau khi dựng backend. Màn hình lật thẻ sẽ nằm ở đây."
      />
    </>
  );
}
