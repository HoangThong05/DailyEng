"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRightIcon } from "./icons";

type Props = {
  children: React.ReactNode;
  /** Nhãn cho hai nút mũi tên, ví dụ "bộ TOEIC". */
  label: string;
  className?: string;
};

/**
 * Hàng cuộn ngang có snap, ẩn thanh cuộn, kèm hai nút mũi tên trái/phải
 * (hiện ở màn có chuột). Trên điện thoại vẫn vuốt như thường.
 */
export function ScrollRow({ children, label, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      setCanPrev(el.scrollLeft > 4);
      setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  function scroll(direction: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    // Cuộn gần một màn, chừa lại một phần thẻ để người dùng thấy tính liên tục.
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  const buttonClass =
    "border-border bg-card text-fg absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition-opacity md:flex disabled:opacity-0 press";

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Xem ${label} phía trước`}
        disabled={!canPrev}
        onClick={() => scroll(-1)}
        className={`${buttonClass} -left-3`}
      >
        <ChevronRightIcon className="h-5 w-5 rotate-180" />
      </button>
      <div
        ref={ref}
        className={`no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto ${className}`}
      >
        {children}
      </div>
      <button
        type="button"
        aria-label={`Xem ${label} tiếp theo`}
        disabled={!canNext}
        onClick={() => scroll(1)}
        className={`${buttonClass} -right-3`}
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
