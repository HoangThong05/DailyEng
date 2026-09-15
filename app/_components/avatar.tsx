import { Mascot } from "./mascot";

type Props = {
  url: string | null | undefined;
  name: string;
  size: number;
  className?: string;
};

/**
 * Ảnh đại diện tròn: ảnh người dùng tải lên, không có thì vịt tốt nghiệp.
 * Ảnh ngoài (Supabase Storage) nên dùng <img> thường, kích thước cố định.
 */
export function Avatar({ url, name, size, className = "" }: Props) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- ảnh người dùng tải lên, đã thu nhỏ sẵn
      <img
        src={url}
        alt={`Ảnh đại diện của ${name}`}
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <Mascot
      variant="tot-nghiep"
      size={size}
      className={`shrink-0 rounded-full ${className}`}
    />
  );
}
