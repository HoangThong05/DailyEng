import { Mascot } from "@/app/_components/mascot";

/**
 * Màn chờ hiện ngay khi bấm chuyển tab, trong lúc server còn dựng trang:
 * vịt vẫy tay chào giữa màn (nghiêng qua lại + nhún) + ba chấm nhấp nháy.
 *
 * Đặt ở cấp nhóm (app) nên mọi tab đều dùng chung, khỏi phải viết cho từng
 * route. Trang nào cần khung riêng thì thêm loading.tsx trong thư mục của nó.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6"
    >
      <div className="relative flex flex-col items-center">
        <Mascot variant="chao-trong" size={140} priority className="duck-wave" />
        <span
          aria-hidden
          className="duck-shadow mt-2 h-2.5 w-20 rounded-full bg-black/40 dark:bg-black/60"
        />
      </div>
      <p className="text-muted flex items-center gap-1 text-sm">
        Đang tải
        <span aria-hidden className="flex gap-0.5">
          <span className="loading-dot">.</span>
          <span className="loading-dot [animation-delay:0.2s]">.</span>
          <span className="loading-dot [animation-delay:0.4s]">.</span>
        </span>
      </p>
    </div>
  );
}
