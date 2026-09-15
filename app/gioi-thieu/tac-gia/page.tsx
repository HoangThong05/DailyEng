import type { Metadata } from "next";
import { Mascot } from "@/app/_components/mascot";
import { SITE } from "@/lib/site";
import { DocPage } from "../_components/doc-page";

export const metadata: Metadata = { title: "Tác giả" };

const SOCIAL_LABELS: Record<keyof typeof SITE.social, string> = {
  github: "GitHub",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  youtube: "YouTube",
};

export default function TacGiaPage() {
  const socials = (Object.keys(SITE.social) as (keyof typeof SITE.social)[]).filter(
    (key) => SITE.social[key],
  );

  return (
    <DocPage title="Tác giả" subtitle="Người làm ra DailyEng và cách liên hệ.">
      <div className="border-border bg-card flex flex-col items-center gap-5 rounded-3xl border p-6 text-center sm:flex-row sm:text-left">
        <Mascot variant="tot-nghiep" size={112} className="shrink-0 rounded-3xl" />
        <div>
          <p className="text-2xl font-extrabold">{SITE.author.name}</p>
          <p className="text-muted mt-1">{SITE.author.role}</p>
          {SITE.author.email ? (
            <a href={`mailto:${SITE.author.email}`} className="text-brand mt-2 inline-block font-semibold">
              {SITE.author.email}
            </a>
          ) : null}
        </div>
      </div>

      <h2>Vì sao có DailyEng</h2>
      <p>
        Mình học tiếng Anh để thi TOEIC và dùng trong công việc sau này, nhưng
        cứ học được vài hôm là bỏ. Thứ mình cần là một app mở lên là học được
        ngay, có nhắc, có thưởng, và nội dung đúng thứ mình cần — nên mình tự
        làm. DailyEng vừa là công cụ học, vừa là dự án để mình rèn kỹ năng lập
        trình web.
      </p>

      <h2>Kết nối</h2>
      <p>
        Mình đăng quá trình làm app và chuyện học tiếng Anh ở các kênh dưới đây.
        Theo dõi, nhắn tin hay góp ý đều rất hoan nghênh.
      </p>
      <div className="flex flex-wrap gap-3">
        {socials.map((key) => (
          <a
            key={key}
            href={SITE.social[key]}
            target="_blank"
            rel="noreferrer"
            className="border-border bg-card flex min-h-11 items-center rounded-xl border px-4 font-semibold no-underline press"
          >
            {SOCIAL_LABELS[key]}
          </a>
        ))}
      </div>
    </DocPage>
  );
}
