import type { Metadata } from "next";
import { PageHeader } from "@/app/_components/page-header";
import { CreateDeckForm } from "./create-deck-form";

export const metadata: Metadata = { title: "Tạo bộ từ" };

export default function TaoBoTuPage() {
  return (
    <>
      <PageHeader title="Tạo bộ từ" subtitle="Bộ này chỉ mình bạn thấy" />
      <CreateDeckForm />
    </>
  );
}