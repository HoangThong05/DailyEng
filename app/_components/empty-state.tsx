import { Mascot, type MascotVariant } from "./mascot";

type EmptyStateProps = {
  icon?: React.ReactNode;
  /** Có linh vật thì hiện linh vật thay cho ô icon. */
  mascot?: MascotVariant;
  title: string;
  description: string;
};

/** Màn hình rỗng dùng cho các tính năng chưa gắn dữ liệu. */
export function EmptyState({ icon, mascot, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-8 py-16 text-center">
      {mascot ? (
        <Mascot variant={mascot} size={128} className="rounded-3xl" />
      ) : (
        <span className="bg-brand-soft text-brand flex h-16 w-16 items-center justify-center rounded-2xl">
          {icon}
        </span>
      )}
      <h2 className="mt-5 text-lg font-semibold">{title}</h2>
      <p className="text-muted mt-2 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
