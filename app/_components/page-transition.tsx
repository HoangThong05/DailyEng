"use client";

import { usePathname } from "next/navigation";

/**
 * Làm nội dung trượt nhẹ lên và hiện dần mỗi khi đổi route.
 * Đổi `key` theo pathname để React mount lại phần tử → animation chạy lại.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter flex flex-1 flex-col">
      {children}
    </div>
  );
}
