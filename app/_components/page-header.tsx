import { Mascot, type MascotVariant } from "./mascot";
import { ThemeButton } from "./theme-button";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  /** Vịt nhỏ bên phải tiêu đề, mỗi tab một tư thế. */
  mascot?: MascotVariant;
};

/**
 * Header dính trên đầu màn hình, tự chừa safe-area cho iPhone tai thỏ.
 * Có dải gradient mờ phía sau tiêu đề, vịt nhỏ và nút sáng/tối ở bên phải.
 */
export function PageHeader({ title, subtitle, trailing, mascot }: PageHeaderProps) {
  return (
    <header className="bg-bg/80 pt-safe sticky top-0 z-40 backdrop-blur-lg">
      {/* Dải sáng gradient: xanh → tím tan dần sang phải, không ảnh hưởng bố cục */}
      <div
        aria-hidden
        className="from-brand/20 pointer-events-none absolute inset-0 bg-gradient-to-r via-violet-500/10 to-transparent"
      />
      <div className="relative flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="text-muted mt-0.5 text-sm">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {trailing}
          {mascot ? (
            <Mascot
              variant={mascot}
              size={48}
              className="header-duck rounded-xl"
            />
          ) : null}
          <ThemeButton />
        </div>
      </div>
    </header>
  );
}
