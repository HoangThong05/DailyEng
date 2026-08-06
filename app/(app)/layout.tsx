import { BottomNav } from "@/app/_components/bottom-nav";

/** Layout cho các màn có tab bar. Trang đăng nhập nằm ngoài nhóm này nên không có tab. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="pb-nav flex-1">{children}</main>
      <BottomNav />
    </>
  );
}
