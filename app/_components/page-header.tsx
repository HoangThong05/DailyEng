type PageHeaderProps = {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
};

/** Header dính trên đầu màn hình, tự chừa safe-area cho iPhone tai thỏ. */
export function PageHeader({ title, subtitle, trailing }: PageHeaderProps) {
  return (
    <header className="bg-bg/85 pt-safe sticky top-0 z-40 backdrop-blur-lg">
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="text-muted mt-0.5 text-sm">{subtitle}</p>
          ) : null}
        </div>
        {trailing}
      </div>
    </header>
  );
}
