import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GAMES } from "@/app/(app)/tro-choi/games";
import { GameCover } from "@/app/(app)/tro-choi/game-cover";
import { FlameIcon } from "@/app/_components/icons";
import { Mascot } from "@/app/_components/mascot";
import { SiteFooter } from "@/app/_components/site-footer";
import { LandingHeader } from "./_components/landing-header";
import { DECK_CATEGORIES } from "@/lib/deck-categories";
import vitHero from "@/public/mascot/vit-hero.png";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "DailyEng — Học tiếng Anh mỗi ngày",
  description:
    "Học từ vựng theo chặng, trò chơi ôn từ, luyện nghe nói và thi thử TOEIC. Miễn phí, chạy trên điện thoại và máy tính.",
};

/** Số liệu nổi bật ở đầu trang. Cập nhật tay khi thêm bộ từ. */
const STATS = [
  { value: "36", label: "bộ từ có sẵn" },
  { value: "3.300+", label: "từ kèm phiên âm, ví dụ" },
  { value: "9", label: "trò chơi & bài luyện" },
  { value: "0đ", label: "miễn phí toàn bộ" },
];

const FEATURES = [
  {
    mascot: "hoc",
    href: "/hoc",
    title: "Học theo chặng",
    text: "Mỗi 5 từ một chặng: gặp từ → trắc nghiệm → điền vào câu. App tự chấm, từ sai quay lại ngay, ôn tập giãn cách đúng lúc sắp quên.",
  },
  {
    mascot: "choi",
    href: "/tro-choi",
    title: "Trò chơi ôn từ",
    text: "Mưa từ vựng, ghép cặp, nghe & gõ, nghe chọn hình… Chơi 5 phút mỗi ngày, từ nào nhớ hay quên đều ghi vào cùng hệ ôn tập.",
  },
  {
    mascot: "noi",
    href: "/ky-nang",
    title: "Luyện nghe – nói",
    text: "Nghe chép câu, shadowing nói theo câu mẫu, luyện phát âm — máy chấm từng từ, ghi âm để bạn so với giọng mẫu.",
  },
  {
    mascot: "tot-nghiep",
    href: "/ky-nang/mock-test",
    title: "Thi thử & tiến độ",
    text: "Mock test TOEIC Part 2 (nghe) và Part 5 (đọc) có đồng hồ, chấm ngay kèm giải thích. Chuỗi ngày, XP, cấp độ và bảng xếp hạng giữ bạn đi đều.",
  },
] as const;

/* Bong bóng bay ngang qua vịt lúc mở trang: vị trí/cỡ cố định theo chỉ số để render ổn định. */
const BUBBLES = Array.from({ length: 22 }, (_, i) => ({
  top: (i * 41 + 7) % 92,
  size: 14 + ((i * 11) % 46),
  delay: (i % 9) * 0.45,
  duration: 9 + (i % 6) * 1.3,
}));

const STEPS = [
  { n: 1, title: "Chọn bộ từ", text: "TOEIC, giao tiếp, công việc… hoặc dán danh sách từ của riêng bạn." },
  { n: 2, title: "Học 10 phút mỗi ngày", text: "Đi qua chặng, chơi một ván, nói theo vài câu. Đủ mục tiêu là vịt ăn mừng." },
  { n: 3, title: "Ôn đúng lúc", text: "Từ sắp quên tự hiện lại. Không cần nhớ hôm nay ôn gì — app nhắc." },
];

export default async function GioiThieuPage() {
  const user = await getCurrentUser();
  const ctaHref = user ? "/" : "/dang-nhap";
  const ctaLabel = user ? "Vào học ngay" : "Bắt đầu miễn phí";

  return (
    <div className="min-h-[100dvh]">
      <LandingHeader showAnchors />

      {/* Bong bóng bay ngang toàn màn hình một lượt khi mở trang; nằm dưới header, không chặn chuột */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
        {BUBBLES.map((bubble, i) => (
          <span
            key={i}
            className="bubble absolute rounded-full"
            style={{
              top: `${bubble.top}%`,
              width: bubble.size,
              height: bubble.size,
              animationDelay: `${bubble.delay}s`,
              animationDuration: `${bubble.duration}s`,
            }}
          />
        ))}
      </div>

      <main className="mx-auto max-w-6xl px-5">
        {/* Hero */}
        <section className="grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
          <div className="stagger">
            <p className="bg-brand-soft text-brand inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase">
              <FlameIcon className="h-4 w-4" /> Học đều mỗi ngày
            </p>
            <h1 className="mt-4 text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Học tiếng Anh mỗi ngày:{" "}
              <span className="from-brand bg-gradient-to-r via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                từ vựng, nghe, nói
              </span>{" "}
              và luyện thi
            </h1>
            <p className="text-muted mt-5 max-w-xl text-lg leading-relaxed">
              Học từ theo chặng có chấm điểm, <strong className="text-fg">trò chơi</strong> ôn
              từ, <strong className="text-fg">shadowing</strong> và nghe chép câu, thi thử{" "}
              <strong className="text-fg">TOEIC</strong> — tất cả ghi vào một hệ ôn tập giãn
              cách, có XP, chuỗi ngày và bảng xếp hạng.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={ctaHref}
                className="bg-brand flex min-h-14 items-center rounded-2xl px-7 text-lg font-bold text-white shadow-lg shadow-blue-500/30 press"
              >
                {ctaLabel}
              </Link>
              <a
                href="#tinh-nang"
                className="border-border bg-card flex min-h-14 items-center rounded-2xl border px-7 text-lg font-semibold press"
              >
                Xem tính năng
              </a>
            </div>
            <p className="text-muted mt-4 text-sm">
              Chạy trên điện thoại và máy tính, cài được như app. Không quảng cáo.
            </p>
          </div>

          {/* Vịt hero (nền trong suốt) lơ lửng trên quầng sáng; bong bóng bay ngang lúc mở trang */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="from-brand/30 absolute inset-[8%] rounded-full bg-gradient-to-br via-violet-500/20 to-fuchsia-500/10 blur-3xl" />
            <div className="header-duck relative">
              <Image
                src={vitHero}
                alt="Vịt DailyEng đeo tai nghe học với laptop"
                priority
                sizes="(min-width: 768px) 448px, 90vw"
                className="hero-duck h-auto w-full cursor-pointer drop-shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* Số liệu */}
        <section className="border-border bg-card grid grid-cols-2 gap-4 rounded-3xl border p-6 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="from-brand bg-gradient-to-r to-violet-500 bg-clip-text text-3xl font-extrabold text-transparent tabular-nums">
                {stat.value}
              </p>
              <p className="text-muted mt-1 text-sm">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* Tính năng */}
        <section id="tinh-nang" className="scroll-mt-24 py-16">
          <h2 className="text-center text-3xl font-extrabold tracking-tight">
            Một app, đủ bốn kỹ năng
          </h2>
          <p className="text-muted mx-auto mt-3 max-w-xl text-center">
            Mọi hoạt động đều nạp vào cùng một hệ ôn tập giãn cách — học kiểu nào cũng tích luỹ.
          </p>
          <div className="stagger mt-10 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="border-border bg-card group flex gap-4 rounded-3xl border p-5 press"
              >
                <Mascot variant={feature.mascot} size={80} className="shrink-0 rounded-2xl" />
                <div>
                  <h3 className="text-lg font-bold">{feature.title}</h3>
                  <p className="text-muted mt-1 text-sm leading-relaxed">{feature.text}</p>
                  <span className="text-brand mt-2 inline-block text-sm font-semibold">
                    Mở{" "}
                    <span className="inline-block transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Trò chơi & bài luyện */}
        <section id="tro-choi" className="scroll-mt-24 pb-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Chơi là nhớ</h2>
              <p className="text-muted mt-2">{GAMES.length} trò chơi và bài luyện, mỗi cái một cách ôn.</p>
            </div>
          </div>
          <div className="no-scrollbar stagger -mx-5 mt-8 flex snap-x gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-3 md:px-0 lg:grid-cols-5">
            {GAMES.map((game) => (
              <Link
                key={game.slug}
                href={game.href}
                className="border-border bg-card group w-[62%] shrink-0 snap-start overflow-hidden rounded-2xl border press sm:w-[40%] md:w-auto"
              >
                <GameCover game={game} sizes="(min-width: 1024px) 220px, 60vw" className="aspect-square" />
                <div className="p-3">
                  <p className="font-bold">{game.title}</p>
                  <p className="text-muted mt-0.5 line-clamp-2 text-xs">{game.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Bộ từ */}
        <section id="bo-tu" className="scroll-mt-24 pb-16">
          <h2 className="text-3xl font-extrabold tracking-tight">Kho từ theo mục tiêu</h2>
          <p className="text-muted mt-2">
            Từ vựng có phiên âm, nghĩa và câu ví dụ — sinh bằng AI rồi duyệt tay. Hoặc dán danh sách từ của bạn từ Excel, Sheets, Quizlet.
          </p>
          <div className="stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {DECK_CATEGORIES.map((category) => (
              <Link
                key={category.key}
                href="/hoc"
                className="border-border bg-card group overflow-hidden rounded-2xl border press"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={`/decks/nhom-${category.key}.webp`}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 220px, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <p className="absolute bottom-3 left-3 text-lg font-bold text-white drop-shadow">
                    {category.label}
                  </p>
                </div>
                <p className="text-muted p-3 text-xs">{category.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Cách hoạt động */}
        <section className="pb-16">
          <h2 className="text-center text-3xl font-extrabold tracking-tight">Ba bước, mười phút</h2>
          <div className="stagger mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n} className="border-border bg-card rounded-3xl border p-6">
                <span className="from-brand flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br to-violet-500 text-lg font-extrabold text-white">
                  {step.n}
                </span>
                <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                <p className="text-muted mt-1 text-sm leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA cuối */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-700 p-8 text-white shadow-lg shadow-blue-500/25 md:p-12">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Hôm nay học 10 từ nhé?</h2>
              <p className="mt-2 max-w-lg text-white/85">
                Đăng nhập bằng Google hoặc email, tiến độ lưu trên mọi thiết bị. Miễn phí, không giới hạn.
              </p>
              <Link
                href={ctaHref}
                className="text-brand mt-6 inline-flex min-h-14 items-center rounded-2xl bg-white px-7 text-lg font-bold shadow-lg press"
              >
                {ctaLabel}
              </Link>
            </div>
            <Mascot variant="an-mung" size={180} className="mx-auto duck-bounce" />
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
