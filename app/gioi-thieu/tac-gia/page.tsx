import type { Metadata } from "next";
import Image from "next/image";
import { Mascot } from "@/app/_components/mascot";
import { AUTHOR } from "@/lib/author";
import { SITE } from "@/lib/site";
import { DocPage } from "../_components/doc-page";

export const metadata: Metadata = {
  title: "Tác giả",
  description: `${AUTHOR.name} — người làm ra DailyEng.`,
};

const SOCIAL_LABELS: Record<keyof typeof SITE.social, string> = {
  github: "GitHub",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  youtube: "YouTube",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="border-brand mb-3 border-l-4 pl-3 text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function TacGiaPage() {
  const socials = (Object.keys(SITE.social) as (keyof typeof SITE.social)[]).filter(
    (key) => SITE.social[key],
  );

  return (
    <DocPage title="Tác giả" subtitle="Người đứng sau DailyEng và lý do app này ra đời.">
      {/* Thẻ giới thiệu: ảnh, tên, vai trò, nơi ở, email */}
      <div className="border-border bg-card flex flex-col items-center gap-6 rounded-3xl border p-6 text-center sm:flex-row sm:text-left">
        {AUTHOR.photo ? (
          <Image
            src={AUTHOR.photo}
            alt={AUTHOR.name}
            width={128}
            height={128}
            className="border-brand/30 h-32 w-32 shrink-0 rounded-full border-4 object-cover"
          />
        ) : (
          <Mascot variant="tot-nghiep" size={128} className="shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-2xl font-extrabold">{AUTHOR.name}</p>
          <p className="text-brand mt-0.5 font-semibold">{AUTHOR.title}</p>
          <div className="text-muted mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm sm:justify-start">
            {AUTHOR.location ? <span>📍 {AUTHOR.location}</span> : null}
            {AUTHOR.email ? (
              <a href={`mailto:${AUTHOR.email}`} className="text-brand font-medium">
                ✉ {AUTHOR.email}
              </a>
            ) : null}
          </div>
          {socials.length > 0 ? (
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {socials.map((key) => (
                <a
                  key={key}
                  href={SITE.social[key]}
                  target="_blank"
                  rel="noreferrer"
                  className="border-border hover:border-brand hover:text-brand rounded-full border px-3 py-1 text-sm font-semibold no-underline transition-colors"
                >
                  {SOCIAL_LABELS[key]}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {AUTHOR.intro ? <p className="mt-6 text-lg leading-relaxed">{AUTHOR.intro}</p> : null}

      {AUTHOR.education.length > 0 ? (
        <Section title="Học vấn">
          <ul className="space-y-3">
            {AUTHOR.education.map((item) => (
              <li key={item.school} className="border-border bg-card rounded-2xl border p-4">
                <p className="font-bold">{item.school}</p>
                <p className="text-muted text-sm">
                  {[item.major, item.time].filter(Boolean).join(" · ")}
                </p>
                {item.note ? <p className="mt-1 text-sm">{item.note}</p> : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {AUTHOR.certificates.length > 0 ? (
        <Section title="Chứng chỉ">
          <div className="grid gap-3 sm:grid-cols-2">
            {AUTHOR.certificates.map((item) => (
              <div
                key={item.name}
                className="border-border bg-card flex items-center gap-3 rounded-2xl border p-4"
              >
                <span className="bg-brand-soft text-brand flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg">
                  {item.value ? "🏅" : "📖"}
                </span>
                <span className="min-w-0">
                  <span className="block font-bold">
                    {item.name}
                    {item.value ? <span className="text-brand"> {item.value}</span> : null}
                  </span>
                  {item.note ? (
                    <span className="text-muted block text-sm">{item.note}</span>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {AUTHOR.awards.length > 0 ? (
        <Section title="Học bổng & giải thưởng">
          <ul className="list-disc space-y-1 pl-5">
            {AUTHOR.awards.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      {AUTHOR.skills.length > 0 ? (
        <Section title="Công nghệ dùng thường xuyên">
          <div className="flex flex-wrap gap-2">
            {AUTHOR.skills.map((skill) => (
              <span
                key={skill}
                className="bg-brand-soft text-brand rounded-full px-3 py-1.5 text-sm font-semibold"
              >
                {skill}
              </span>
            ))}
          </div>
        </Section>
      ) : null}

      {AUTHOR.projects.length > 0 ? (
        <Section title="Dự án">
          <ul className="space-y-3">
            {AUTHOR.projects.map((item) => (
              <li key={item.name} className="border-border bg-card rounded-2xl border p-4">
                <p className="flex flex-wrap items-baseline gap-2">
                  <span className="font-bold">{item.name}</span>
                  {item.time ? (
                    <span className="text-muted text-sm">{item.time}</span>
                  ) : null}
                </p>
                <p className="text-muted mt-1 text-sm leading-relaxed">{item.description}</p>
                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand mt-2 inline-block text-sm font-semibold"
                  >
                    {item.linkLabel ?? "Xem thêm"} →
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {AUTHOR.story.length > 0 ? (
        <Section title="Vì sao có DailyEng">
          <div className="space-y-4 leading-relaxed">
            {AUTHOR.story.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
        </Section>
      ) : null}

      {AUTHOR.quote ? (
        <figure className="from-brand/10 mt-10 rounded-3xl bg-gradient-to-br to-emerald-500/5 p-6 text-center">
          <blockquote className="text-lg leading-relaxed font-semibold text-balance">
            “{AUTHOR.quote}”
          </blockquote>
          <figcaption className="text-muted mt-3 text-sm">— {AUTHOR.name}</figcaption>
        </figure>
      ) : null}
    </DocPage>
  );
}
