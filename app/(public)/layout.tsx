/**
 * Layout cho các trang không cần đăng nhập (đăng nhập, nhập mã, offline).
 * Chỉ có một form ở giữa nên luôn giữ bề ngang cỡ điện thoại, kể cả trên
 * màn hình lớn.
 */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
      {children}
    </div>
  );
}
