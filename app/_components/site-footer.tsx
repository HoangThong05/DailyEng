import Link from "next/link";
import { SITE } from "@/lib/site";
import { Mascot } from "./mascot";

type SocialKey = keyof typeof SITE.social;

/** Icon mạng xã hội vẽ tay (24×24, fill theo currentColor) — không cần thư viện. */
function SocialIcon({ name, className }: { name: SocialKey; className?: string }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "currentColor",
    className,
    "aria-hidden": true,
  };
  switch (name) {
    case "github":
      return (
        <svg {...props}>
          <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...props}>
          <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.5-1.5h1.4V5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V11H8v3h2.5v7h3Z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...props}>
          <path d="M6.4 8.6H3.3V20h3.1V8.6ZM4.9 3.5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6ZM20.7 13c0-3.3-1.8-4.7-4.1-4.7-1.5 0-2.5.8-3 1.5V8.6h-3.1V20h3.1v-5.6c0-1.5.3-2.9 2.1-2.9 1.8 0 1.9 1.7 1.9 3V20h3.1v-7Z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...props}>
          <path d="M16.6 3c.3 2.2 1.6 3.6 3.7 3.8v3c-1.4 0-2.6-.4-3.7-1.2v6.2c0 3.3-2.6 5.7-5.8 5.7a5.6 5.6 0 0 1-5.7-5.6c0-3.4 2.9-6 6.4-5.5v3.1c-.3-.1-.6-.1-.9-.1a2.5 2.5 0 0 0-2.5 2.6c0 1.4 1.1 2.5 2.6 2.5 1.6 0 2.7-1.1 2.7-2.8V3h3.2Z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...props}>
          <path d="M22 8.2c-.2-1.3-1-2.2-2.3-2.4C17.8 5.5 12 5.5 12 5.5s-5.8 0-7.7.3C3 6 2.2 6.9 2 8.2 1.7 10 1.7 12 1.7 12s0 2 .3 3.8c.2 1.3 1 2.2 2.3 2.4 1.9.3 7.7.3 7.7.3s5.8 0 7.7-.3c1.3-.2 2.1-1.1 2.3-2.4.3-1.8.3-3.8.3-3.8s0-2-.3-3.8ZM10 15V9l5.2 3L10 15Z" />
        </svg>
      );
  }
}

const SOCIAL_LABELS: Record<SocialKey, string> = {
  github: "GitHub",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  youtube: "YouTube",
};

const INFO_LINKS = [
  { href: "/gioi-thieu/ve-dailyeng", label: "Về DailyEng" },
  { href: "/gioi-thieu/tac-gia", label: "Tác giả" },
  { href: "/gioi-thieu/bao-mat", label: "Chính sách bảo mật" },
  { href: "/gioi-thieu/dieu-khoan", label: "Điều khoản sử dụng" },
  { href: "/gioi-thieu/gop-y", label: "Góp ý" },
];

const FEATURE_LINKS = [
  { href: "/hoc", label: "Học từ vựng" },
  { href: "/tro-choi", label: "Trò chơi" },
  { href: "/ky-nang", label: "Luyện kỹ năng" },
  { href: "/ky-nang/mock-test", label: "Mock test TOEIC" },
  { href: "/xep-hang", label: "Bảng xếp hạng" },
];

/** Footer đầy đủ, chỉ dùng ở trang giới thiệu. */
export function SiteFooter() {
  const socials = (Object.keys(SITE.social) as SocialKey[]).filter(
    (key) => SITE.social[key],
  );
  const year = new Date().getFullYear();

  return (
    <footer className="border-border mt-16 border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <Mascot variant="tot-nghiep" size={44} className="rounded-xl" />
            <span className="from-brand bg-gradient-to-r to-violet-500 bg-clip-text text-xl font-extrabold text-transparent">
              {SITE.name}
            </span>
          </div>
          <p className="text-muted mt-3 max-w-sm text-sm leading-relaxed">
            {SITE.tagline}
          </p>

          <p className="mt-6 text-sm font-semibold">Tác giả</p>
          <p className="mt-1 font-bold">{SITE.author.name}</p>
          <p className="text-muted text-sm">{SITE.author.role}</p>
          {SITE.author.email ? (
            <a
              href={`mailto:${SITE.author.email}`}
              className="text-brand mt-1 block text-sm hover:underline"
            >
              {SITE.author.email}
            </a>
          ) : null}

          {socials.length > 0 ? (
            <div className="mt-4 flex gap-2">
              {socials.map((key) => (
                <a
                  key={key}
                  href={SITE.social[key]}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={SOCIAL_LABELS[key]}
                  title={SOCIAL_LABELS[key]}
                  className="border-border bg-card text-muted hover:text-brand hover:border-brand/50 flex h-10 w-10 items-center justify-center rounded-full border press"
                >
                  <SocialIcon name={key} className="h-5 w-5" />
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-bold tracking-wide uppercase">Tính năng</p>
          <ul className="text-muted mt-3 space-y-2 text-sm">
            {FEATURE_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-fg hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-bold tracking-wide uppercase">Thông tin</p>
          <ul className="text-muted mt-3 space-y-2 text-sm">
            {INFO_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-fg hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-border text-muted border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-4 text-xs">
          <span>© {year} {SITE.name}</span>
          <span>Ảnh minh hoạ trò Nghe chọn hình từ Pixabay.</span>
        </div>
      </div>
    </footer>
  );
}
