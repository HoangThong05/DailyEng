import { SiteFooter } from "@/app/_components/site-footer";
import { LandingHeader } from "./landing-header";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

/**
 * Khung cho các trang thông tin (Về DailyEng, Tác giả, Bảo mật, Điều khoản,
 * Góp ý): header + tiêu đề + nội dung dạng bài viết + footer.
 */
export function DocPage({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-[100dvh]">
      <LandingHeader />
      <main className="mx-auto max-w-3xl px-5 py-10 md:py-14">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
        {subtitle ? <p className="text-muted mt-2 text-lg">{subtitle}</p> : null}
        <div className="doc mt-8 space-y-4 leading-relaxed">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
