import Link from "next/link";
import { ChevronRightIcon } from "./icons";

type ActionCardProps = {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

/** Thẻ bấm được ở màn Home. Không dùng hover — phản hồi chạm bằng active:scale. */
export function ActionCard({ href, title, description, icon }: ActionCardProps) {
  return (
    <Link
      href={href}
      className="border-border bg-card flex min-h-[72px] items-center gap-4 rounded-2xl border p-4 transition-transform duration-100 active:scale-[0.98]"
    >
      <span className="bg-brand-soft text-brand flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="text-muted block text-sm">{description}</span>
      </span>
      <ChevronRightIcon className="text-muted h-5 w-5 shrink-0" />
    </Link>
  );
}
