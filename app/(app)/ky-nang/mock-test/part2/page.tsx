import { PageHeader } from "@/app/_components/page-header";
import { isAiEnabled } from "@/lib/ai";
import { buildPart2Test, PART2_SECONDS, signMockKey } from "@/lib/mock-test";
import { Part2Session } from "./part2-session";

export const metadata = { title: "Đang làm Part 2" };

/** Mỗi lần mở là một đề mới. */
export const dynamic = "force-dynamic";

export default function Part2RunPage() {
  const questions = buildPart2Test();
  const token = signMockKey(questions);

  return (
    <>
      <PageHeader title="Part 2" subtitle={`${questions.length} câu · ${PART2_SECONDS / 60} phút · chỉ nghe`} />
      <div className="mx-auto w-full max-w-md md:max-w-2xl">
        <Part2Session questions={questions} token={token} seconds={PART2_SECONDS} aiEnabled={isAiEnabled()} />
      </div>
    </>
  );
}
