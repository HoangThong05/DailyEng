import { PageHeader } from "@/app/_components/page-header";
import { isAiEnabled } from "@/lib/ai";
import { buildMockTest, MOCK_SECONDS, signMockKey } from "@/lib/mock-test";
import { MockSession } from "./mock-session";

export const metadata = { title: "Đang làm mock test" };

/** Mỗi lần mở là một đề mới: trộn ở server, không cache. */
export const dynamic = "force-dynamic";

export default async function MockTestRunPage() {
  const questions = await buildMockTest();
  const token = signMockKey(questions);

  return (
    <>
      <PageHeader title="Part 5" subtitle={`${questions.length} câu · ${MOCK_SECONDS / 60} phút`} />
      <div className="mx-auto w-full max-w-md md:max-w-2xl">
        <MockSession questions={questions} token={token} seconds={MOCK_SECONDS} aiEnabled={isAiEnabled()} />
      </div>
    </>
  );
}
